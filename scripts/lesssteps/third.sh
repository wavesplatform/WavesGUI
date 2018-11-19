#!/usr/bin/env bash

TMP_PATH=tmp

for i in "$@"
do
case $i in
    -t=*|--theme=*)
        THEME="${i#*=}"
        CONFIG_PATH="./src/themeConfig/$THEME"
    ;;
    -n=*|--name=*)
        FILENAME="${i#*=}"
    ;;
    -f=*|--files=*)
        FILENAMES="${i#*=}"
    ;;
esac
done
FILENAME="$THEME-$FILENAME"
FILE="$TMP_PATH/$FILENAME"

echo 'auto prefix'
node_modules/.bin/postcss $FILE -o $FILE || exit 1
echo 'uglify css'
mkdir -p dist
mkdir -p dist/tmp
mkdir -p dist/tmp/css
node_modules/.bin/uglifycss $FILE >> dist/tmp/css/$FILENAME || exit 1
echo 'less >> DONE'

exit 0;
