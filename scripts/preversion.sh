#!/usr/bin/env bash

echo 'pre version'

node_modules/.bin/gulp all || exit 1
npm run test || exit 1
#npm run testdist || exit 1
npm run testmin || exit 1

echo 'pre version >> DONE'
