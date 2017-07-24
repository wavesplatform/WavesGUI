#!/usr/bin/env bash

echo 'post version'

node_modules/.bin/gulp up-version-json || exit 1
git push origin HEAD || exit 1
git push origin HEAD --tags || exit 1
