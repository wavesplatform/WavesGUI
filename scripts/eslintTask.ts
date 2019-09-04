import { TaskFunction } from 'gulp';
import { createSpawn } from './utils';
import { normalize } from 'path';

export function createEslintTask(): TaskFunction {
    return function eslintTask() {
        return createSpawn(normalize('./node_modules/.bin/eslint'), [
            '-c', '.eslintrc.json',
            normalize('./src/modules/')
        ]);
    }
}
