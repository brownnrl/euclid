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
#   3. UP-TO TypeScript — view/test/{type}/{sub}.html opened in firefox
#                         (against http://localhost:8000/) using a chromeless
#                         profile, so the window tiles cleanly under WMs like
#                         xmonad/i3/sway. The TS port of the same view.
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
#   - docker
#   - both images built:
#       docker build -f Containerfile          -t euclid-applet:latest  .
#       docker build -f Containerfile.firefox  -t euclid-firefox:latest .
#   - X11 server with `xhost +local:docker` accepted
#   - python3 -m http.server already running at the repo root on :8000
#
# Note: firefox runs in its own euclid-firefox container (not on the host),
# so the user's regular firefox instance is never disturbed.

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
APPLET_DIR_HOST="$REPO_ROOT/view/applet-tests"
APPLET_DIR_CONT=/usr/src/app/view/applet-tests
HTTP_BASE=http://localhost:8000
APPLET_IMAGE=euclid-applet:latest
FIREFOX_IMAGE=euclid-firefox:latest
VIEWER_FLAGS='-J-Djava.security.manager -J-Djava.security.policy=/usr/src/app/permissive.policy'

# ----------------------------------------------------------------------
# Preflight checks
# ----------------------------------------------------------------------

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERROR: '$1' is required but not found in PATH." >&2; exit 1; }
}
require docker
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

if ! docker image inspect "$APPLET_IMAGE" >/dev/null 2>&1; then
  echo "ERROR: Docker image '$APPLET_IMAGE' not found. Build it first:" >&2
  echo "    docker build -f Containerfile -t $APPLET_IMAGE ." >&2
  exit 1
fi

if ! docker image inspect "$FIREFOX_IMAGE" >/dev/null 2>&1; then
  echo "ERROR: Docker image '$FIREFOX_IMAGE' not found. Build it first:" >&2
  echo "    docker build -f Containerfile.firefox -t $FIREFOX_IMAGE ." >&2
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
echo "  3. TS        — same in the TypeScript port (chromeless firefox)"
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

CONTAINERS=()

cleanup() {
  echo ""
  echo "Cleaning up..."
  for cid in "${CONTAINERS[@]}"; do
    docker stop "$cid" >/dev/null 2>&1 || true
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
    "$APPLET_IMAGE" \
    bash -c "appletviewer $VIEWER_FLAGS $container_path" >/dev/null
}

ORIG_CONTAINER="euclid-orig-$$"
APPLET_CONTAINER="euclid-applet-$$"
FIREFOX_CONTAINER="euclid-firefox-$$"

echo "Starting ORIGINAL appletviewer..."
run_appletviewer "$ORIG_CONTAINER" "$APPLET_DIR_CONT/$ORIG_REL"
CONTAINERS+=("$ORIG_CONTAINER")

echo "Starting UP-TO appletviewer..."
run_appletviewer "$APPLET_CONTAINER" "$APPLET_DIR_CONT/$APPLET_REL"
CONTAINERS+=("$APPLET_CONTAINER")

# ----------------------------------------------------------------------
# Firefox runs in its own euclid-firefox container so the user's regular
# firefox instance is never disturbed (no "Close Firefox" dialog, no
# profile collision, no MOZ_NO_REMOTE escape-hatch needed). The chromeless
# profile is created on the host and bind-mounted into the container at
# /profile so the userChrome.css customizations apply.
# ----------------------------------------------------------------------

FF_PROFILE_DIR_HOST="${XDG_CACHE_HOME:-$HOME/.cache}/euclid-harness/firefox-profile"
FF_PROFILE_DIR_CONT=/profile

if [[ ! -d "$FF_PROFILE_DIR_HOST" ]]; then
  mkdir -p "$FF_PROFILE_DIR_HOST/chrome"
  cat >"$FF_PROFILE_DIR_HOST/chrome/userChrome.css" <<'CSS_EOF'
/* Hide tab bar, nav/url bar, bookmarks bar, and titlebar so the firefox
   window content is just the rendered page — application-style view without
   firefox requesting fullscreen (which tiling WMs honor by floating the
   window on top of everything else). */
#TabsToolbar,
#nav-bar,
#PersonalToolbar,
#titlebar {
  visibility: collapse !important;
}
CSS_EOF
  cat >"$FF_PROFILE_DIR_HOST/user.js" <<'PREFS_EOF'
// Allow userChrome.css to take effect (Firefox 69+ requires this opt-in).
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
// Don't restore previous session — we always pass an explicit URL.
user_pref("browser.sessionstore.resume_from_crash", false);
user_pref("browser.startup.page", 0);
// Suppress the "default browser" prompt and other first-run noise.
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.startup.homepage_override.mstone", "ignore");
PREFS_EOF
fi

# Drop a stale lock file from a previous interrupted run.
rm -f "$FF_PROFILE_DIR_HOST/.parentlock" "$FF_PROFILE_DIR_HOST/lock" 2>/dev/null

echo "Starting firefox in container (chromeless profile) for TS view..."
echo "  profile: $FF_PROFILE_DIR_HOST"

# --network host: lets the container reach the host's python http.server
#                 on localhost:8000 directly (no need for host.docker.internal).
# --user $UID:$GID: matches host uid so the bind-mounted profile dir has
#                   compatible ownership and firefox can write to it.
# HOME=/tmp: gives firefox a writable scratch dir without needing a real
#            user account inside the container.
docker run --rm -d \
  --name "$FIREFOX_CONTAINER" \
  --network host \
  --user "$(id -u):$(id -g)" \
  -e DISPLAY="$DISPLAY" \
  -e HOME=/tmp \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v "$FF_PROFILE_DIR_HOST":"$FF_PROFILE_DIR_CONT" \
  "$FIREFOX_IMAGE" \
  firefox -profile "$FF_PROFILE_DIR_CONT" "$HTTP_BASE/$TS_REL" >/dev/null

CONTAINERS+=("$FIREFOX_CONTAINER")

# Give firefox a moment to either show a window or exit. If the container
# died immediately, dump its logs so the user can see why.
sleep 2
if ! docker ps --format '{{.Names}}' | grep -qE "^${FIREFOX_CONTAINER}\$"; then
  echo "" >&2
  echo "ERROR: firefox container exited within 2s of launch. Logs were:" >&2
  echo "----" >&2
  docker logs "$FIREFOX_CONTAINER" 2>&1 || true
  echo "----" >&2
  echo "" >&2
  echo "Common causes:" >&2
  echo "  - Profile dir corrupted: rm -rf $FF_PROFILE_DIR_HOST and retry" >&2
  echo "  - X11 not reachable from docker: check \`xhost\` output" >&2
  exit 1
fi

echo ""
echo "Three windows launched. Press Ctrl-C in this terminal to close them."
echo ""

# Wait until any of the three containers exits, then teardown via the trap.
while true; do
  running=$(docker ps --format '{{.Names}}' | grep -cE "^($ORIG_CONTAINER|$APPLET_CONTAINER|$FIREFOX_CONTAINER)\$" || true)
  if [[ "$running" -lt 3 ]]; then
    break
  fi
  sleep 2
done
