#!/usr/bin/env bash

# This script is temporary for transition to husky

rm -rf \
    .git/hooks/pre-commit \
    .git/hooks/commit-msg \
    ./scripts/*.js \
    ./scripts/*.js.map \
    ./ts-scripts/*.js \
    ./ts-scripts/*.js.map \
    ./karma.conf.js \
    ./karma.conf.js.map \
    ./server.js \
    ./server.js.map
