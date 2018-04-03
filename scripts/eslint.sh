#!/usr/bin/env bash

node_modules/.bin/eslint -c ./.eslintrc.json ./src/modules/ || exit 1
