#!/usr/bin/env bash

echo 'compile less'
node_modules/.bin/lessc src/less/index.less tmp/style.css || exit 1
echo 'auto prefix'
node_modules/.bin/postcss tmp/style.css -o tmp/style.css || exit 1
echo 'uglify css'
mkdir dist
mkdir dist/dev
mkdir dist/dev/css
node_modules/.bin/uglifycss tmp/style.css > dist/dev/css/style.css || exit 1
rm -rf tmp
echo 'less >> DONE'

exit 0;