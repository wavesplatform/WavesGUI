"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulp_1 = require("gulp");
const concat = require("gulp-concat");
const hash = require('gulp-hash-filename');
const header = require('gulp-header');
const footer = require('gulp-footer');
function createConcatTask(name, input, output, wrapper) {
    function concatTask() {
        return wrapper
            ? gulp_1.src(input)
                .pipe(concat(name))
                .pipe(header(wrapper[0]))
                .pipe(footer(wrapper[1]))
                .pipe(hash())
                .pipe(gulp_1.dest(output))
            : gulp_1.src(input)
                .pipe(concat(name))
                .pipe(hash())
                .pipe(gulp_1.dest(output));
    }
    concatTask.displayName = concatTask.name + ':' + name;
    return concatTask;
}
exports.createConcatTask = createConcatTask;
//# sourceMappingURL=concatTask.js.map