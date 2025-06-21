#!/bin/bash
cd /usr/src/app/view
appletviewer \
  -J-Djava.security.manager \
  -J-Djava.security.policy=/usr/src/app/permissive.policy \
  -J-Djava.security.debug=all \
  -J-Dsun.applet.debug=true \
  -J-Dsun.applet.verbose=true \
  eulerline.html
