"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gulp_1 = require("gulp");
const templateCache = require("gulp-angular-templatecache");
const htmlmin = require("gulp-htmlmin");
const hash = require('gulp-hash-filename');
function createTemplatesTask(input, output, options) {
    return function templatesTask() {
        return gulp_1.src(input)
            .pipe(htmlmin({ collapseWhitespace: true }))
            .pipe(templateCache(options))
            .pipe(hash())
            .pipe(gulp_1.dest(output));
    };
}
exports.createTemplatesTask = createTemplatesTask;
//# sourceMappingURL=templatesTask.js.map