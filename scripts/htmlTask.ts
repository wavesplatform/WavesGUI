import { outputFile } from 'fs-extra';
import { TaskFunction } from 'gulp';
import { join, basename } from 'path';
import { getFilesFrom, getInitScript, IPrepareHTMLOptions, prepareExport, prepareHTML } from '../ts-scripts/utils';

function getScriptsList(input: string) {
    const filesMap = getFilesFrom(input)
        .reduce<{[k: string]: string}>((acc, filename) => {
            const key = basename(filename).replace(/(:?\.min)-.+\.js$/, '');
            acc[key] = filename;
            return acc;
        }, {});

    return [
        filesMap['vendors'],
        filesMap['sentry-vendors'],
        filesMap['bundle'],
        filesMap['templates']
    ];
}

function getStylesList(input: string, themes: string[]) {
    const filesMap = getFilesFrom(input)
        .reduce<{[k: string]: string}>((acc, filename) => {
            const key = basename(filename).replace(/(:?\.min)-.+\.css$/, '');
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

export function createHtmlTask(params: IPrepareHTMLOptions): TaskFunction {
    return function htmlTask() {
        params.scripts = [
            ...params.scripts,
            ...getScriptsList(join(params.target, 'js'))
        ];

        params.styles = [
            ...params.styles,
            ...getStylesList(join(params.target, 'css'), params.themes)
        ];

        return Promise.all([
            prepareHTML(params),
            getInitScript(null, null, params),
            prepareExport()
        ]).then(([file, initScript, exportTemplate]) => Promise.all([
            outputFile(`${params.target}/index.html`, file),
            outputFile(`${params.target}/init.js`, initScript),
            outputFile(`${params.target}/export.html`, exportTemplate),
        ]));
    }
}
