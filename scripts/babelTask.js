"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulp_1 = require("gulp");
const babel = require("gulp-babel");
const concat = require("gulp-concat");
const uglify = require('gulp-uglify');
const hash = require('gulp-hash-filename');
const header = require('gulp-header');
const footer = require('gulp-footer');
function createBabelTask(name, input, output) {
    function babelTask() {
        return gulp_1.src(input)
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
            .pipe(gulp_1.dest(output));
    }
    babelTask.displayName = babelTask.name + ':' + name;
    return babelTask;
}
exports.createBabelTask = createBabelTask;
//# sourceMappingURL=babelTask.js.map