#!/usr/bin/env bash

echo 'pre version'
node_modules/.bin/gulp up-version-json || exit 1
