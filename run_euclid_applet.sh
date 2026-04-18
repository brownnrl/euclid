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
# Shared helpers
# ----------------------------------------------------------------------

CONTAINERS=()

cleanup_containers() {
  for cid in "${CONTAINERS[@]}"; do
    docker stop "$cid" >/dev/null 2>&1 || true
  done
  CONTAINERS=()
}

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

# Firefox profile setup (shared across all iterations)
FF_PROFILE_DIR_HOST="${XDG_CACHE_HOME:-$HOME/.cache}/euclid-harness/firefox-profile"
FF_PROFILE_DIR_CONT=/profile

if [[ ! -d "$FF_PROFILE_DIR_HOST" ]]; then
  mkdir -p "$FF_PROFILE_DIR_HOST/chrome"
  cat >"$FF_PROFILE_DIR_HOST/chrome/userChrome.css" <<'CSS_EOF'
#TabsToolbar,
#nav-bar,
#PersonalToolbar,
#titlebar {
  visibility: collapse !important;
}
CSS_EOF
  cat >"$FF_PROFILE_DIR_HOST/user.js" <<'PREFS_EOF'
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("browser.sessionstore.resume_from_crash", false);
user_pref("browser.startup.page", 0);
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.startup.homepage_override.mstone", "ignore");
PREFS_EOF
fi

launch_three_windows() {
  local choice="$1"
  local applet_rel="${APPLET_PATH_REL[$choice]}"
  local orig_rel="${ORIGINAL_PATH_REL[$choice]}"
  local ts_rel="${TS_PATH_REL[$choice]}"

  local orig_cont="euclid-orig-$$"
  local applet_cont="euclid-applet-$$"
  local firefox_cont="euclid-firefox-$$"

  rm -f "$FF_PROFILE_DIR_HOST/.parentlock" "$FF_PROFILE_DIR_HOST/lock" 2>/dev/null

  run_appletviewer "$orig_cont" "$APPLET_DIR_CONT/$orig_rel"
  CONTAINERS+=("$orig_cont")

  run_appletviewer "$applet_cont" "$APPLET_DIR_CONT/$applet_rel"
  CONTAINERS+=("$applet_cont")

  docker run --rm -d \
    --name "$firefox_cont" \
    --network host \
    --user "$(id -u):$(id -g)" \
    -e DISPLAY="$DISPLAY" \
    -e HOME=/tmp \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    -v "$FF_PROFILE_DIR_HOST":"$FF_PROFILE_DIR_CONT" \
    "$FIREFOX_IMAGE" \
    firefox -profile "$FF_PROFILE_DIR_CONT" "$HTTP_BASE/$ts_rel" >/dev/null
  CONTAINERS+=("$firefox_cont")

  sleep 2
  if ! docker ps --format '{{.Names}}' | grep -qE "^${firefox_cont}\$"; then
    echo "  WARN: firefox container exited early" >&2
  fi
}

# ----------------------------------------------------------------------
# Mode selection: single pick or loop-through-all
# ----------------------------------------------------------------------

echo ""
echo "Euclid 3-way construction comparison"
echo "====================================="
echo "  1. ORIGINAL  — Joyce's full proposition in Java appletviewer"
echo "  2. UP-TO     — same trimmed to focus on this construction (Java)"
echo "  3. TS        — same in the TypeScript port (chromeless firefox)"
echo ""
echo "Modes:"
echo "  s) Select a single construction (classic mode)"
echo "  a) Loop through ALL constructions sequentially"
echo ""
read -rp "Mode [s/a]: " MODE

case "$MODE" in
  a|A)
    # ------------------------------------------------------------------
    # Loop mode: cycle through all constructions.
    #   ENTER = OK, advance to next
    #   B     = mark as bad, print name, advance to next
    #   Q     = quit immediately
    # ------------------------------------------------------------------
    trap cleanup_containers EXIT INT TERM
    BAD_LIST=()
    TOTAL=${#LABELS[@]}

    for i in "${!LABELS[@]}"; do
      CHOICE="${LABELS[$i]}"
      NUM=$((i + 1))
      echo ""
      echo "[$NUM/$TOTAL] $CHOICE"
      launch_three_windows "$CHOICE"

      read -rp "  ENTER=ok  B=bad  Q=quit: " ACTION
      cleanup_containers

      case "$ACTION" in
        b|B)
          BAD_LIST+=("$CHOICE")
          echo "  >> MARKED BAD: $CHOICE"
          ;;
        q|Q)
          echo ""
          echo "Quitting early at [$NUM/$TOTAL]."
          break
          ;;
        *)
          # ENTER or anything else = OK, continue
          ;;
      esac
    done

    # Print summary
    echo ""
    echo "=============================="
    echo "Review complete."
    if [[ ${#BAD_LIST[@]} -eq 0 ]]; then
      echo "All constructions passed!"
    else
      echo "BAD constructions (${#BAD_LIST[@]}):"
      for bad in "${BAD_LIST[@]}"; do
        echo "  - $bad"
      done
    fi
    echo "=============================="
    ;;

  *)
    # ------------------------------------------------------------------
    # Single-pick mode (original behavior)
    # ------------------------------------------------------------------
    PS3=$'\nSelect a construction (or Ctrl-C to quit): '
    COLUMNS=1

    select CHOICE in "${LABELS[@]}"; do
      if [[ -z "$CHOICE" ]]; then
        echo "Invalid selection."
        continue
      fi
      break
    done

    echo ""
    echo "Selected: $CHOICE"

    trap cleanup_containers EXIT INT TERM
    launch_three_windows "$CHOICE"

    echo ""
    echo "Three windows launched. Press Ctrl-C to close them."
    echo ""

    while true; do
      running=$(docker ps --format '{{.Names}}' | grep -cE "euclid-(orig|applet|firefox)-$$" || true)
      if [[ "$running" -lt 3 ]]; then
        break
      fi
      sleep 2
    done
    ;;
esac
