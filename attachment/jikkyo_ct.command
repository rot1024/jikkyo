#!/bin/sh
basedir=`dirname "$0"`

if [ -f "$basedir/jikkyo.app/Contents/MacOS/nwjs" ]; then
  "$basedir/jikkyo.app/Contents/MacOS/nwjs" --disable-gpu --force-cpu-draw &
else
  "$basedir/../node_modules/.bin/nw" "$basedir/../src" --disable-gpu --force-cpu-draw &
fi
