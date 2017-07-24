#!/usr/bin/env bash

node_modules/.bin/eslint -c ./.eslintrc.json ./src/js/\!\(vendor\)/**/*.js || exit 1
