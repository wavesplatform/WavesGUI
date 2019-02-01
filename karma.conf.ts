import { getFilesFrom } from './ts-scripts/utils';
import { readJSONSync } from 'fs-extra';
import { IMetaJSON, IPackageJSON } from './ts-scripts/interface';


module.exports = function (config) {
    'use strict';

    const jsFiles = getFilesFrom('src/js', '.js');
    const pack: IPackageJSON = readJSONSync('./package.json');
    const meta: IMetaJSON = readJSONSync('./ts-scripts/meta.json');
    let mode;

    process.argv.some((param) => {
        if (param.includes('mode=')) {
            mode = param.replace('mode=', '');
            return true;
        }
    });

    mode = mode || 'development';

    let files;
    let global = {
        statements: 39,
        lines: 39,
        functions: 32,
        branches: 15
    };

    const name = 'testnet';

    switch (mode) {
        case 'development':
            files = meta.vendors.concat(jsFiles);
            break;
        case 'dist':
        case 'min':
            files = [
                `dist/${name}/js/${pack.name}-${name}-${pack.version}.js`,
                'src/js/test/mock/module.js',
                'src/js/**/*.spec.js'
            ];
            Object.keys(global).forEach((key) => {
                global[key] = 0;
            });
            break;
    }

    console.log(mode);

    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        files,

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'src/js/**/!(*.spec).js': ['coverage']
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress', 'coverage'],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values:
        // config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        coverageReporter: {
            type: 'html',
            dir: 'coverage/',
            check: { global }
        },

    });
};
