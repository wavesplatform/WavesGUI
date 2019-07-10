#!/usr/bin/env bash

echo "run post install script"

echo "compile typescript"
./node_modules/.bin/tsc || exit 1
npm run data-services || exit 1
echo "compile typescript >> DONE"

echo "run post install script >> DONE"


echo "apply aliases"
git config alias.s status
git config alias.p "push origin HEAD"
git config alias.a "add ."
git config alias.rh "reset --hard"
git config alias.c "!./node_modules/.bin/ts-node ./ts-scripts/commit.ts"
git config alias.pu "!./node_modules/.bin/ts-node ./ts-scripts/pull.ts"
echo "apply aliases >> DONE"


exit 0
