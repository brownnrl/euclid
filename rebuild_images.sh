#!/bin/bash
# Rebuild both docker images used by run_euclid_applet.sh:
#
#   - euclid-applet:latest   (Java 8 + appletviewer + X11 libs)
#   - euclid-firefox:latest  (Ubuntu 20.04 + firefox + X11 libs)
#
# Any extra arguments are passed through to `docker build`, so common
# options work as expected:
#
#   ./rebuild_images.sh                 # normal rebuild (uses cache)
#   ./rebuild_images.sh --no-cache      # force a from-scratch rebuild
#   ./rebuild_images.sh --pull          # also pull a fresh ubuntu:20.04 base
#   ./rebuild_images.sh --pull --no-cache
#
# Run from anywhere — the script cd's to its own directory first so the
# build context is always the repo root.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: 'docker' not found in PATH." >&2
  exit 1
fi

EXTRA_ARGS=("$@")

echo ""
echo "Rebuilding euclid-applet:latest and euclid-firefox:latest"
[[ ${#EXTRA_ARGS[@]} -gt 0 ]] && echo "Extra docker build args: ${EXTRA_ARGS[*]}"

echo ""
echo "===================================================================="
echo "  [1/2] euclid-applet:latest  (from Containerfile)"
echo "===================================================================="
docker build "${EXTRA_ARGS[@]}" -f Containerfile -t euclid-applet:latest "$REPO_ROOT"

echo ""
echo "===================================================================="
echo "  [2/2] euclid-firefox:latest  (from Containerfile.firefox)"
echo "===================================================================="
docker build "${EXTRA_ARGS[@]}" -f Containerfile.firefox -t euclid-firefox:latest "$REPO_ROOT"

echo ""
echo "===================================================================="
echo "  Done. Both images rebuilt:"
docker image ls --filter 'reference=euclid-applet:latest' --filter 'reference=euclid-firefox:latest' \
  --format 'table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}'
echo "===================================================================="
