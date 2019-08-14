import { src, dest, TaskFunction } from 'gulp';
import * as less from 'gulp-less';
import * as concat from 'gulp-concat';

const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const hash = require('gulp-hash-filename');

interface IOptions {
    modifyVars?: {};
    paths?: string[];
    plugins?: any[];
    relativeUrls?: boolean;
}

export function createLessTask(
    name: string,
    input: string,
    output: string,
    options: IOptions
): TaskFunction {
    function lessTask() {
        return src(input)
            .pipe(less(options))
            .pipe(concat(name))
            .pipe(postcss([
                autoprefixer({ browsers: ['last 2 versions'] }),
                cssnano()
            ]))
            .pipe(hash())
            .pipe(dest(output));
    }

    lessTask.displayName = lessTask.name + ':' + name;

    return lessTask;
}
