import { TaskFunction } from 'gulp';
import { createSpawn } from './utils';

export function createDataServicesTask(): TaskFunction {
    return async function dataServicesTask() {
        await createSpawn('./node_modules/.bin/tsc', [
            '-p', './data-service'
        ]);

        await createSpawn('./node_modules/.bin/browserify', [
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

        await createSpawn('./node_modules/.bin/babel', [
            './data-service-dist/data-service-es6.js',
            '--presets=es2015',
            '--plugins=transform-decorators-legacy,transform-class-properties,transform-object-rest-spread',
            '-o', './data-service-dist/data-service.js'
        ]);
    }
}
