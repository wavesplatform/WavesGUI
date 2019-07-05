"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulp_1 = require("gulp");
const less = require("gulp-less");
const concat = require("gulp-concat");
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const hash = require('gulp-hash-filename');
function createLessTask(name, input, output, options) {
    function lessTask() {
        return gulp_1.src(input)
            .pipe(less(options))
            .pipe(concat(name))
            .pipe(postcss([
            autoprefixer({ browsers: ['last 2 versions'] }),
            cssnano()
        ]))
            .pipe(hash())
            .pipe(gulp_1.dest(output));
    }
    lessTask.displayName = lessTask.name + ':' + name;
    return lessTask;
}
exports.createLessTask = createLessTask;
//# sourceMappingURL=lessTask.js.map