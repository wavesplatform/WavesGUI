#!/usr/bin/env bash

echo "run post install script!"

echo "run bower install"
bower install || exit 1
echo "bower install >> DONE"

echo "copy hooks"
cp hooks/pre-commit .git/hooks || exit 1
echo "copy hooks >> DONE"

exit 0
