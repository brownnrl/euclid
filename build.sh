#!/bin/bash
cd src/
tsc
cd ..
tsc
npx webpack
