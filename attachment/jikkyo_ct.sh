#!/bin/sh
basedir=`dirname "$0"`

if [ -f "$basedir/jikkyo" ]; then
  "$basedir/jikkyo" --enable-transparent-visuals --disable-gpu --force-cpu-draw &
else
  "$basedir/../node_modules/.bin/nw" "$basedir/../src" --enable-transparent-visuals --disable-gpu --force-cpu-draw &
fi
