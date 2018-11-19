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

echo 'compile less'
mkdir -p tmp
cat /dev/null > $FILE

exit 0;
