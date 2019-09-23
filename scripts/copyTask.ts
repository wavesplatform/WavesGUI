import { copy } from 'fs-extra';
import { TaskFunction } from 'gulp';

interface ICopyParams {
    from: string;
    to: string;
}

export function createCopyTask(params: ICopyParams[]): TaskFunction {
    return function copyTask() {
        return Promise.all(params.map(param => copy(param.from, param.to)));
    }
}
