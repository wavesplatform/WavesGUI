#!/usr/bin/env bash

echo "run post install script"

echo "run bower install"
bower install || exit 1
echo "bower install >> DONE"

echo "copy hooks"
cp hooks/pre-commit .git/hooks || exit 1
cp hooks/commit-msg .git/hooks || exit 1
cp hooks/post-checkout .git/hooks || exit 1
echo "copy hooks >> DONE"

echo "compile typescript"
./node_modules/.bin/tsc -p ./ || exit 1
echo "compile typescript >> DONE"

echo "apply aliases"
git config alias.s status
git config alias.p "push origin HEAD"
git config alias.a "add ."
git config alias.rh "reset --hard"
git config alias.c "!node ./ts-scripts/commit.js"
echo "apply aliases >> DONE"

echo "build-local"
node_modules/.bin/gulp build-local || exit 1
echo "build-local >> DONE"

echo "run post install script >> DONE"

node server.js
open "http://localhost:8080"

exit 0
