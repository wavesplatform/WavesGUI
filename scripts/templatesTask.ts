import { src, dest, TaskFunction } from 'gulp';
import * as templateCache from 'gulp-angular-templatecache';
import * as htmlmin from 'gulp-htmlmin';

const hash = require('gulp-hash-filename');

export function createTemplatesTask(
    input: string | string[],
    output: string,
    options: templateCache.Options
): TaskFunction {
    return function templatesTask() {
        return src(input)
            .pipe(htmlmin({ collapseWhitespace: true }))
            .pipe(templateCache(options))
            .pipe(hash())
            .pipe(dest(output));
    }
}
