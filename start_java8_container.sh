#!/bin/bash

xhost +local:docker  # Allow X11 access for GUI

docker run -it --rm \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v "$PWD":/usr/src/app \
  euclid-applet:latest \
  bash
