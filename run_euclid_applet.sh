#!/bin/bash
# Run the Java geometry applet for a specific construction test.
# Each file in view/applet-tests/ is a stripped-down version of the
# source proposition that inspired the TypeScript test view page.

APPLET_DIR=/usr/src/app/view/applet-tests
VIEWER_FLAGS=(
  -J-Djava.security.manager
  -J-Djava.security.policy=/usr/src/app/permissive.policy
)

declare -A ENTRIES
ENTRIES=(
  ["circle;radius           (Post.3)"]="circle-radius.html"
  ["circle;circumcircle     (III.10)"]="circle-circumcircle.html"
  ["line;bichord            (I.1)"]="line-bichord.html"
  ["line;perpendicular      (Post.4)"]="line-perpendicular.html"
  ["point;intersection      (Def I.2)"]="point-intersection.html"
  ["point;foot              (lemma X.33)"]="point-foot.html"
  ["point;circumcenter      (III.25a)"]="point-circumcenter.html"
  ["point;vertex            (I.9)"]="point-vertex.html"
  ["point;parallelogram     (I.28)"]="point-parallelogram.html"
  ["polygon;equilateralTriangle (I.10)"]="poly-equilateralTriangle.html"
  ["sector;sector           (Def III.10)"]="sector-sector.html"
  ["euler line demo"]="eulerline.html"
)

# Build ordered list for display
LABELS=(
  "circle;radius           (Post.3)"
  "circle;circumcircle     (III.10)"
  "line;bichord            (I.1)"
  "line;perpendicular      (Post.4)"
  "point;intersection      (Def I.2)"
  "point;foot              (lemma X.33)"
  "point;circumcenter      (III.25a)"
  "point;vertex            (I.9)"
  "point;parallelogram     (I.28)"
  "polygon;equilateralTriangle (I.10)"
  "sector;sector           (Def III.10)"
  "euler line demo"
)

echo ""
echo "Euclid Applet — Construction Viewer"
echo "====================================="
PS3=$'\nSelect a construction (or Ctrl-C to quit): '

select LABEL in "${LABELS[@]}"; do
  FILE="${ENTRIES[$LABEL]}"
  if [[ -z "$FILE" ]]; then
    echo "Invalid selection."
    continue
  fi

  if [[ "$FILE" == "eulerline.html" ]]; then
    TARGET=/usr/src/app/view/eulerline.html
  else
    TARGET="$APPLET_DIR/$FILE"
  fi

  echo "Opening: $TARGET"
  appletviewer "${VIEWER_FLAGS[@]}" "$TARGET"
  break
done
