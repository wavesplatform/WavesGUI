import { TaskFunction } from 'gulp';
import { createSpawn } from './utils';

export function createEslintTask(): TaskFunction {
    return function eslintTask() {
        return createSpawn('./node_modules/.bin/eslint', [
            '-c', '.eslintrc.json',
            './src/modules/'
        ]);
    }
}
