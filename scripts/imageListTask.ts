import { writeFile } from 'fs-extra';
import { TaskFunction } from 'gulp';

export function createImageListTask(input: string[], output: string, reg: RegExp): TaskFunction {
    return function imageListTask() {
        const images = input.map((path) => path.replace(reg, ''));

        return writeFile(output, JSON.stringify(images));
    }
}
