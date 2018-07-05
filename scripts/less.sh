#!/usr/bin/env bash

echo 'compile less'
mkdir -p tmp
find src -name "*.less" -exec node_modules/.bin/lessc --include-path=./lessConfig/default {} \; > tmp/style.css
echo 'auto prefix'
node_modules/.bin/postcss tmp/style.css -o tmp/style.css || exit 1
echo 'uglify css'
mkdir -p dist
mkdir -p dist/tmp
mkdir -p dist/tmp/css
node_modules/.bin/uglifycss tmp/style.css > dist/tmp/css/style.css || exit 1
echo 'less >> DONE'

exit 0;
