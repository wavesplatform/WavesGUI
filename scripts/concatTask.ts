import { src, dest, TaskFunction } from 'gulp';
import * as concat from 'gulp-concat';

const hash = require('gulp-hash-filename');
const header = require('gulp-header');
const footer = require('gulp-footer');

export function createConcatTask(
    name: string,
    input: string | string[],
    output: string,
    wrapper?: string[]
): TaskFunction {
    function concatTask() {
        return wrapper
            ? src(input)
                .pipe(concat(name))
                .pipe(header(wrapper[0]))
                .pipe(footer(wrapper[1]))
                .pipe(hash())
                .pipe(dest(output))
            : src(input)
                .pipe(concat(name))
                .pipe(hash())
                .pipe(dest(output))
            ;
    }

    concatTask.displayName = concatTask.name + ':' + name;

    return concatTask;
}
