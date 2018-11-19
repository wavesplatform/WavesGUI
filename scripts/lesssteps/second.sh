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

for s in $FILENAMES; do node_modules/.bin/lessc --include-path=$CONFIG_PATH $s >> $FILE; done

exit 0;
