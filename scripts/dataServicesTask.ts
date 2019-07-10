import { TaskFunction } from 'gulp';
import { createSpawn } from './utils';
import { normalize } from 'path';

export function createDataServicesTask(): TaskFunction {
    return async function dataServicesTask() {

        await createSpawn(normalize('./node_modules/.bin/tsc'), [
            '-p', normalize('./data-service')
        ]);

        await createSpawn(normalize('./node_modules/.bin/browserify'), [
            normalize('data-service/index.js'),
            '-s', 'ds',
            '-u', 'ts-utils',
            '-u', 'ramda',
            '-u', '@waves/oracle-data',
            '-u', '@waves/data-entities',
            '-u', '@waves/signature-generator',
            '-u', '@waves/signature-adapter',
            '--no-bf',
            '-o', normalize('./data-service-dist/data-service-es6.js')
        ]);

        await createSpawn(normalize('./node_modules/.bin/babel'), [
            normalize('./data-service-dist/data-service-es6.js'),
            '--presets=es2015',
            '--plugins=transform-decorators-legacy,transform-class-properties,transform-object-rest-spread',
            '-o', normalize('./data-service-dist/data-service.js')
        ]);
    };
}