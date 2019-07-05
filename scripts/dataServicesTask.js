"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
function createDataServicesTask() {
    return function dataServicesTask() {
        return __awaiter(this, void 0, void 0, function* () {
            yield utils_1.createSpawn('node', [
                './node_modules/.bin/tsc',
                '-p', './data-service'
            ]);
            yield utils_1.createSpawn('node', [
                './node_modules/.bin/browserify',
                'data-service/index.js',
                '-s', 'ds',
                '-u', 'ts-utils',
                '-u', 'ramda',
                '-u', '@waves/oracle-data',
                '-u', '@waves/data-entities',
                '-u', '@waves/signature-generator',
                '-u', '@waves/signature-adapter',
                '--no-bf',
                '-o', './data-service-dist/data-service-es6.js'
            ]);
            yield utils_1.createSpawn('node', [
                './node_modules/.bin/babel',
                './data-service-dist/data-service-es6.js',
                '--presets=es2015',
                '--plugins=transform-decorators-legacy,transform-class-properties,transform-object-rest-spread',
                '-o', './data-service-dist/data-service.js'
            ]);
        });
    };
}
exports.createDataServicesTask = createDataServicesTask;
//# sourceMappingURL=dataServicesTask.js.map