#!/usr/bin/env bash

TMP_PATH=tmp

for i in "$@"
do
case $i in
    -t=*|--theme=*)
        THEME="${i#*=}"
    ;;
    -n=*|--name=*)
        FILENAME="${i#*=}"
    ;;
esac
done

FILENAME="$THEME-$FILENAME"

FILE_SOURCE="$TMP_PATH/$THEME"

node_modules/.bin/postcss $FILE_SOURCE -o $FILE_SOURCE || exit 1
mkdir -p dist
mkdir -p dist/tmp
mkdir -p dist/tmp/css
node_modules/.bin/uglifycss $FILE_SOURCE >> dist/tmp/css/$FILENAME || exit 1

exit 0;
