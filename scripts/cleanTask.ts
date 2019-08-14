import { TaskFunction } from 'gulp';
import { createSpawn } from './utils';

export function createCleanTask(): TaskFunction {
    return function cleanTask() {
        return createSpawn('rm', [
            '-rf',
            './build',
            './dist',
            './tmp',
            './data-service-dist'
        ]);
    }
}
