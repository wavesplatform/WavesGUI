#!/usr/bin/env bash
./node_modules/.bin/tsc -p ./data-service  || exit 1
echo "compile data services >> DONE"
./node_modules/.bin/browserify data-service/index.js -s ds -u @waves/bignumber -u @waves/oracle-data -u ts-utils -u @waves/data-entities -u @waves/waves-transactions -u @waves/signature-adapter -u ramda --no-bf -o ./data-service-dist/data-service-es6.js
./node_modules/.bin/babel data-service-dist/data-service-es6.js --presets=es2015 --plugins=transform-decorators-legacy,transform-class-properties,transform-object-rest-spread > data-service-dist/data-service.js
echo "Build data services >> DONE"
exit 0
