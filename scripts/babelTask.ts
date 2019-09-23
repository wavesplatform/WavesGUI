import { src, dest, TaskFunction } from 'gulp';
import * as babel from 'gulp-babel';
import * as concat from 'gulp-concat';

const uglify = require('gulp-uglify');
const hash = require('gulp-hash-filename');
const header = require('gulp-header');
const footer = require('gulp-footer');

export function createBabelTask(
    name: string,
    input: string | string[],
    output: string
): TaskFunction {
    function babelTask() {
        return src(input)
            .pipe(concat(name))
            .pipe(babel({
                presets: ['es2015'],
                plugins: [
                    'transform-decorators-legacy',
                    'transform-class-properties',
                    'transform-decorators',
                    'transform-object-rest-spread',
                    'transform-async-to-generator'
                ]
            }))
            .pipe(header('(function () {'))
            .pipe(footer('})()'))
            .pipe(uglify({
                mangle: false
            }))
            .pipe(hash())
            .pipe(dest(output));
    }

    babelTask.displayName = babelTask.name + ':' + name;

    return babelTask;
}
