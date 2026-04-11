#!/bin/bash
# Three-way comparison harness for the Euclid TypeScript port.
#
# For a chosen construction, opens THREE windows side by side:
#
#   1. ORIGINAL applet  — view/applet-tests/{type}/{cons}/original.html in
#                         appletviewer (Java port of the original Joyce work).
#   2. UP-TO applet     — view/applet-tests/{type}/{cons}/applet.html in
#                         appletviewer (the original trimmed to focus on the
#                         construction, visually equivalent to the TS test
#                         page below).
#   3. UP-TO TypeScript — view/test/{type}/{sub}.html opened in firefox kiosk
#                         mode against http://localhost:8000/ (the TS port of
#                         the same up-to-construction view).
#
# This makes a triple A/B/C visual comparison: how Joyce drew it (1),
# how the port reproduces it in the original Java engine (2), and how the
# TypeScript port renders the same params (3). Windows 2 and 3 should be
# pixel-equivalent at rest; window 1 carries the full surrounding proposition
# and is just there for context.
#
# The script auto-discovers every view/applet-tests/{type}/{cons}/applet.html
# and reads the matching TS path from a `<!-- TS: ... -->` header comment in
# the file, so adding a new construction is just a matter of dropping the two
# files into the right folder.
#
# REQUIREMENTS (host side):
#   - docker (with the euclid-applet:latest image already built)
#   - X11 server with `xhost +local:docker` accepted
#   - firefox in $PATH
#   - python3 -m http.server already running at the repo root on :8000

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
APPLET_DIR_HOST="$REPO_ROOT/view/applet-tests"
APPLET_DIR_CONT=/usr/src/app/view/applet-tests
HTTP_BASE=http://localhost:8000
DOCKER_IMAGE=euclid-applet:latest
VIEWER_FLAGS='-J-Djava.security.manager -J-Djava.security.policy=/usr/src/app/permissive.policy'

# ----------------------------------------------------------------------
# Preflight checks
# ----------------------------------------------------------------------

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERROR: '$1' is required but not found in PATH." >&2; exit 1; }
}
require docker
require firefox
require curl

if ! curl -s -o /dev/null --connect-timeout 1 "$HTTP_BASE/" ; then
  cat >&2 <<EOF
ERROR: $HTTP_BASE/ is not responding.

This script assumes a static dev server is already serving the repo root on
port 8000. Start one in another terminal first:

    cd $REPO_ROOT
    python3 -m http.server 8000

then re-run this script.
EOF
  exit 1
fi

if ! docker image inspect "$DOCKER_IMAGE" >/dev/null 2>&1; then
  echo "ERROR: Docker image '$DOCKER_IMAGE' not found. Build it first:" >&2
  echo "    docker build -f Containerfile -t $DOCKER_IMAGE ." >&2
  exit 1
fi

# Allow the docker user to talk to the host X server.
xhost +local:docker >/dev/null

# ----------------------------------------------------------------------
# Auto-discover constructions: every folder under applet-tests/ that has
# an applet.html file is a valid construction. Read the TS path out of the
# applet.html's `<!-- TS: ... -->` header comment.
# ----------------------------------------------------------------------

mapfile -t APPLET_FILES < <(cd "$APPLET_DIR_HOST" && find . -mindepth 3 -maxdepth 3 -type f -name 'applet.html' | sort)

if [[ ${#APPLET_FILES[@]} -eq 0 ]]; then
  echo "ERROR: No applet.html files found under $APPLET_DIR_HOST" >&2
  exit 1
fi

LABELS=()
declare -A APPLET_PATH_REL
declare -A ORIGINAL_PATH_REL
declare -A TS_PATH_REL

for rel in "${APPLET_FILES[@]}"; do
  rel="${rel#./}"                       # point/parallelogram/applet.html
  type="${rel%%/*}"                     # point
  rest="${rel#*/}"                      # parallelogram/applet.html
  cons="${rest%%/*}"                    # parallelogram

  applet_full="$APPLET_DIR_HOST/$rel"
  original_rel="$type/$cons/original.html"
  original_full="$APPLET_DIR_HOST/$original_rel"

  if [[ ! -f "$original_full" ]]; then
    echo "WARN: $rel has no sibling original.html — skipping" >&2
    continue
  fi

  # Pull the TS path out of the applet.html header.
  # Format expected: <!-- TS: view/test/point/parallelogram.html -->
  ts_rel=$(grep -oE '<!--[[:space:]]*TS:[[:space:]]*[^[:space:]]+' "$applet_full" \
           | head -n1 \
           | sed -E 's/<!--[[:space:]]*TS:[[:space:]]*//')
  if [[ -z "$ts_rel" ]]; then
    echo "WARN: $rel has no '<!-- TS: ... -->' header comment — skipping" >&2
    continue
  fi
  ts_full="$REPO_ROOT/$ts_rel"
  if [[ ! -f "$ts_full" ]]; then
    echo "WARN: $rel declares TS=$ts_rel but that file does not exist — skipping" >&2
    continue
  fi

  label=$(printf '%-7s ;%s' "$type" "$cons")
  LABELS+=("$label")
  APPLET_PATH_REL["$label"]="$rel"
  ORIGINAL_PATH_REL["$label"]="$original_rel"
  TS_PATH_REL["$label"]="$ts_rel"
done

if [[ ${#LABELS[@]} -eq 0 ]]; then
  echo "ERROR: No usable applet.html files (with TS header + sibling original.html)." >&2
  exit 1
fi

# ----------------------------------------------------------------------
# Picker
# ----------------------------------------------------------------------

echo ""
echo "Euclid 3-way construction comparison"
echo "====================================="
echo "  1. ORIGINAL  — Joyce's full proposition in Java appletviewer"
echo "  2. UP-TO     — same trimmed to focus on this construction (Java)"
echo "  3. TS        — same in the TypeScript port (firefox kiosk)"
echo ""
PS3=$'\nSelect a construction (or Ctrl-C to quit): '
COLUMNS=1

select CHOICE in "${LABELS[@]}"; do
  if [[ -z "$CHOICE" ]]; then
    echo "Invalid selection."
    continue
  fi
  break
done

APPLET_REL="${APPLET_PATH_REL[$CHOICE]}"
ORIG_REL="${ORIGINAL_PATH_REL[$CHOICE]}"
TS_REL="${TS_PATH_REL[$CHOICE]}"

echo ""
echo "Selected: $CHOICE"
echo "  ORIGINAL: $APPLET_DIR_CONT/$ORIG_REL"
echo "  UP-TO   : $APPLET_DIR_CONT/$APPLET_REL"
echo "  TS      : $HTTP_BASE/$TS_REL"
echo ""

# ----------------------------------------------------------------------
# Spawn the three windows
# ----------------------------------------------------------------------

PIDS=()
CONTAINERS=()

cleanup() {
  echo ""
  echo "Cleaning up..."
  for cid in "${CONTAINERS[@]}"; do
    docker stop "$cid" >/dev/null 2>&1 || true
  done
  for pid in "${PIDS[@]}"; do
    kill "$pid" >/dev/null 2>&1 || true
  done
}
trap cleanup EXIT INT TERM

run_appletviewer() {
  local name="$1"
  local container_path="$2"
  docker run --rm -d \
    --name "$name" \
    -e DISPLAY="$DISPLAY" \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    -v "$REPO_ROOT":/usr/src/app \
    -w /usr/src/app \
    "$DOCKER_IMAGE" \
    bash -c "appletviewer $VIEWER_FLAGS $container_path" >/dev/null
}

ORIG_CONTAINER="euclid-orig-$$"
APPLET_CONTAINER="euclid-applet-$$"

echo "Starting ORIGINAL appletviewer..."
run_appletviewer "$ORIG_CONTAINER" "$APPLET_DIR_CONT/$ORIG_REL"
CONTAINERS+=("$ORIG_CONTAINER")

echo "Starting UP-TO appletviewer..."
run_appletviewer "$APPLET_CONTAINER" "$APPLET_DIR_CONT/$APPLET_REL"
CONTAINERS+=("$APPLET_CONTAINER")

echo "Starting firefox kiosk for TS view..."
firefox --new-window --kiosk "$HTTP_BASE/$TS_REL" >/dev/null 2>&1 &
PIDS+=($!)

echo ""
echo "Three windows launched. Press Ctrl-C in this terminal to close them."
echo ""

# Wait for any of: both containers to exit, or firefox to exit, or signal.
while true; do
  if ! docker ps --format '{{.Names}}' | grep -qE "^($ORIG_CONTAINER|$APPLET_CONTAINER)\$"; then
    break
  fi
  if ! kill -0 "${PIDS[0]}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
