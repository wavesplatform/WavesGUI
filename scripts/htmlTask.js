"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = require("../ts-scripts/utils");
function getScriptsList(input) {
    const filesMap = utils_1.getFilesFrom(input)
        .reduce((acc, filename) => {
        const key = path_1.basename(filename).replace(/(:?\.min)-.+\.js$/, '');
        acc[key] = filename;
        return acc;
    }, {});
    return [
        filesMap['vendors'],
        filesMap['bundle'],
        filesMap['templates']
    ];
}
function getStylesList(input, themes) {
    const filesMap = utils_1.getFilesFrom(input)
        .reduce((acc, filename) => {
        const key = path_1.basename(filename).replace(/(:?\.min)-.+\.css$/, '');
        acc[key] = filename;
        return acc;
    }, {});
    return [
        { name: filesMap['vendor-styles'], theme: '' },
        ...themes.map(theme => ({
            name: filesMap[`${theme}-styles`],
            theme
        }))
    ];
}
function createHtmlTask(params) {
    return function htmlTask() {
        params.scripts = [
            ...params.scripts,
            ...getScriptsList(path_1.join(params.target, 'js'))
        ];
        params.styles = [
            ...params.styles,
            ...getStylesList(path_1.join(params.target, 'css'), params.themes)
        ];
        return Promise.all([
            utils_1.prepareHTML(params),
            utils_1.getInitScript(null, null, params),
            utils_1.prepareExport()
        ]).then(([file, initScript, exportTemplate]) => Promise.all([
            fs_extra_1.outputFile(`${params.target}/index.html`, file),
            fs_extra_1.outputFile(`${params.target}/init.js`, initScript),
            fs_extra_1.outputFile(`${params.target}/export.html`, exportTemplate),
        ]));
    };
}
exports.createHtmlTask = createHtmlTask;
//# sourceMappingURL=htmlTask.js.map