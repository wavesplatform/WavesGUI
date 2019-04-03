import * as gulp from 'gulp';
import * as concat from 'gulp-concat';
import * as babel from 'gulp-babel';
import { exec, execSync } from 'child_process';
import {
    download,
    getAllLessFiles,
    getFilesFrom,
    prepareHTML,
    run,
    task,
    getScripts,
    getStyles,
    getInitScript,
    getLocales
} from './ts-scripts/utils';
import { basename, extname, join, sep } from 'path';
import {
    copy,
    outputFile,
    outputFileSync,
    readdir,
    readFile,
    readJSON,
    readJSONSync,
    writeFile,
} from 'fs-extra';

import { IMetaJSON, IPackageJSON, TBuild, TConnection, TPlatform } from './ts-scripts/interface';
import * as templateCache from 'gulp-angular-templatecache';
import * as htmlmin from 'gulp-htmlmin';
import { readFileSync, writeFileSync, unlink } from 'fs';
import { render } from 'less';

const zip = require('gulp-zip');
const extract = require('extract-zip');

const { themes: THEMES } = readJSONSync(join(__dirname, 'src/themeConfig', 'theme.json'));
const meta: IMetaJSON = readJSONSync(join(__dirname, 'ts-scripts', 'meta.json'));
const pack: IPackageJSON = readJSONSync(join(__dirname, 'package.json'));
const configurations = Object.keys(meta.configurations);

const SOURCE_FILES = getFilesFrom(join(__dirname, 'src'), '.js');
const IMAGE_LIST = getFilesFrom(join(__dirname, 'src', 'img'), ['.png', '.svg', '.jpg'], (name, path) => path.indexOf('no-preload') === -1);
const JSON_LIST = getFilesFrom(join(__dirname, 'src'), '.json');

const taskHash = {
    concat: [],
    html: [],
    copy: [],
    zip: [],
    forElectron: []
};

const tmpJsPath = join(__dirname, 'dist', 'tmp', 'js');
const tmpCssPath = join(__dirname, 'dist', 'tmp', 'css');
const vendorName = 'vendors.js';
const bundleName = 'bundle.js';
const templatesName = 'templates.js';
const cssName = `${pack.name}-styles-${pack.version}.css`;
const vendorCssName = `${pack.name}-vendor-styles-${pack.version}.css`; //TODO need drop cache?
const vendorPath = join(tmpJsPath, vendorName);
const bundlePath = join(tmpJsPath, bundleName);
const templatePath = join(tmpJsPath, templatesName);
const steelSheetsFiles = {};

const getFileName = (name, type) => {
    const postfix = type === 'min' ? '.min' : '';
    return `${name.replace('.js', '')}${postfix}.js`;
};


const indexPromise = readFile(join(__dirname, 'src', 'index.hbs'), { encoding: 'utf8' });

['web', 'desktop'].forEach((buildName: TPlatform) => {

    configurations.forEach((configName: TConnection) => {

        ['normal', 'min'].forEach((type: TBuild) => {

            const targetPath = join(__dirname, 'dist', buildName, configName, type);
            const jsFileName = getName(`${pack.name}-${buildName}-${configName}-${pack.version}.js`);
            const jsFilePath = join(targetPath, 'js', jsFileName);
            const taskPostfix = `${buildName}-${configName}-${type}`;

            task(`concat-${taskPostfix}`, [type === 'min' ? 'uglify' : 'babel'], function (done) {
                const stream = gulp.src([vendorPath, getName(bundlePath), getName(templatePath)])
                    .pipe(concat(jsFileName))
                    .pipe(gulp.dest(join(targetPath, 'js')));

                stream.on('end', function () {
                    readFile(join(targetPath, 'js', jsFileName), { encoding: 'utf8' }).then((file) => {
                        if (buildName === 'desktop') {
                            file = `(function () {\nvar module = undefined;\n${file}})();`;
                        }
                        outputFile(join(targetPath, 'js', jsFileName), file)
                            .then(() => done());
                    });
                });
            });
            taskHash.concat.push(`concat-${taskPostfix}`);

            const copyDeps = ['concat-style', 'downloadLocales'];

            task(`copy-${taskPostfix}`, copyDeps, function (done) {
                    const reg = new RegExp(`(.*?\\${sep}src)`);
                    let forCopy = JSON_LIST.map((path) => {
                        return copy(path, path.replace(reg, `${targetPath}`));
                    }).concat(
                        copy(join(__dirname, 'src/fonts'), `${targetPath}/fonts`),
                        meta.exportPageVendors.map(p => copy(join(__dirname, p), join(targetPath, p)))
                    );

                    forCopy.push(copy(join('dist', 'locale'), join(targetPath, 'locales')));
                    forCopy.push(copy(join(__dirname, 'tradingview-style'), join(targetPath, 'tradingview-style')));

                    if (buildName === 'desktop') {
                        const electronFiles = getFilesFrom(join(__dirname, 'electron'), '.js');
                        electronFiles.forEach((path) => {
                            const name = basename(path);
                            forCopy.push(copy(path, join(targetPath, name)));
                        });
                        forCopy.push(copy(join(__dirname, 'electron', 'icons'), join(targetPath, 'img', 'icon.png')));
                        forCopy.push(copy(join(__dirname, 'electron', 'waves.desktop'), join(targetPath, 'waves.desktop')));
                        forCopy.push(copy(join(__dirname, 'node_modules', 'i18next', 'dist'), join(targetPath, 'i18next')));
                    }

                    Promise.all([
                        Promise.all(meta.copyNodeModules.map((path) => {
                            return copy(join(__dirname, path), join(targetPath, path));
                        })) as Promise<any>,
                        copy(join(__dirname, 'src/img'), `${targetPath}/img`).then(() => {
                            const images = IMAGE_LIST.map((path) => path.replace(reg, ''));
                            return writeFile(join(targetPath, 'img', 'images-list.json'), JSON.stringify(images));
                        }),
                        copy(tmpCssPath, join(targetPath, 'css')),
                        copy('LICENSE', join(`${targetPath}`, 'LICENSE')),
                        copy('googleAnalytics.js', join(`${targetPath}`, 'googleAnalytics.js')),
                        copy('amplitude.js', join(`${targetPath}`, 'amplitude.js')),
                    ].concat(forCopy)).then(() => {
                        done();
                    }, (e) => {
                        done(e);
                    });
                }
            );
            taskHash.copy.push(`copy-${taskPostfix}`);

            const htmlDeps = [
                `concat-${taskPostfix}`,
                `copy-${taskPostfix}`
            ];

            task(`html-${taskPostfix}`, htmlDeps, function (done) {
                const scripts = [jsFilePath];
                const outerScripts = [
                    '<script src="https://cdn.ravenjs.com/3.22.3/raven.min.js" crossorigin="anonymous"><\/script>',
                    '<script>Raven.config("https://edc3970622f446d7aa0c9cb38be44a4f@sentry.io/291068").install();<\/script>'
                ];

                if (buildName === 'desktop') {
                    meta.electronScripts.forEach((fileName) => {
                        scripts.push(join(targetPath, fileName));
                    });
                }

                indexPromise
                    .then(() => {

                        const styles = [{ name: join('/css', vendorCssName), theme: null }];

                        for (const theme of THEMES) {
                            styles.push({
                                name: join('/css', `${theme}-${cssName}`), theme
                            });
                        }

                        const params = {
                            buildType: type,
                            target: targetPath,
                            connection: configName,
                            type: buildName,
                            outerScripts,
                            scripts,
                            styles,
                            themes: THEMES
                        };

                        const filePromise = prepareHTML(params);
                        const initScript = getInitScript(null, null, null, params);
                        return Promise.all([filePromise, initScript]);
                    })
                    .then(([file, initScript]) => Promise.all([
                        outputFile(`${targetPath}/index.html`, file),
                        outputFile(`${targetPath}/init.js`, initScript),
                    ]))
                    .then(() => done());
            });

            taskHash.html.push(`html-${taskPostfix}`);

            if (buildName === 'desktop') {
                task(`electron-create-package-json-${taskPostfix}`, [`html-${taskPostfix}`], function (done) {
                    const targetPackage = Object.create(null);

                    meta.electron.createPackageJSONFields.forEach((name) => {
                        targetPackage[name] = pack[name];
                    });

                    Object.assign(targetPackage, meta.electron.defaults);
                    targetPackage.server = meta.electron.server;

                    writeFile(join(targetPath, 'package.json'), JSON.stringify(targetPackage, null, 4))
                        .then(() => done());
                });
                taskHash.forElectron.push(`electron-create-package-json-${taskPostfix}`);
            }

            function getName(name) {
                return getFileName(name, type);
            }

        });

    });

    task(`zip-${buildName}`, [
        `concat-${buildName}-mainnet-min`,
        `html-${buildName}-mainnet-min`,
        `copy-${buildName}-mainnet-min`
    ], function () {
        return gulp.src(`dist/${buildName}/mainnet/min/**/*.*`)
            .pipe(zip(`${pack.name}-${buildName}-v${pack.version}.zip`))
            .pipe(gulp.dest('dist'));
    });
    taskHash.zip.push(`zip-${buildName}`);

});

task('up-version-json', function (done) {
    console.log('new version: ', pack.version);

    const promises = [
        './src/desktop/package.json'
    ].map((path) => {
        return readJSON(path).then((json) => {
            json.version = pack.version;
            return outputFile(path, JSON.stringify(json, null, 2));
        });
    });

    Promise.all(promises)
        .then(() => {
            return run('git', ['add', '.']);
        })
        .then(() => {
            return run('git', ['commit', '-m', `Message: "${pack.version}" for other json files`]);
        })
        .then(() => {
            done();
        });
});

task('templates', function () {
    return gulp.src(['src/**/*.html', 'src/!(index.hbs)/**/*.hbs'])
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(templateCache({
            module: 'app.templates'
        }))
        .pipe(gulp.dest(tmpJsPath));
});

task('concat-style', ['less'], function () {
    steelSheetsFiles[vendorCssName] = { theme: false };
    return gulp.src(meta.stylesheets)
        .pipe(concat(vendorCssName))
        .pipe(gulp.dest(tmpCssPath));
});

task('concat-develop-sources', function () {
    return gulp.src(SOURCE_FILES)
        .pipe(concat(bundleName))
        .pipe(gulp.dest(tmpJsPath));
});

task('concat-develop-vendors', function () {
    return gulp.src(meta.vendors)
        .pipe(concat(vendorName))
        .pipe(gulp.dest(tmpJsPath));
});

task('downloadLocales', ['concat-develop-sources'], function (done) {
    const dist = join(__dirname, 'dist');
    getLocales(dist).then(() => done());
});

task('clean', function () {
    execSync(`sh ${join('scripts', 'clean.sh')}`);
});

task('eslint', function (done) {
    run('sh', ['scripts/eslint.sh']).then(() => done());
});

task('less', function () {
    const files = getAllLessFiles();
    for (const theme of THEMES) {
        outputFileSync(join(__dirname, 'tmp', theme), '');
        let bigFile = '';
        let promise = Promise.resolve();

        for (const file of files) {
            let readFile = readFileSync(file).toString();

            promise = promise.then(() => {
                return (render as any)(readFile, {
                    filename: join(file),
                    paths: join(__dirname, `src/themeConfig/${theme}`)
                } as any)
                    .then(function (output) {
                            bigFile = bigFile + output.css;
                        },
                        function (error) {
                            console.log(error);
                        });
            });
        }

        promise.then(() => {
            outputFileSync(join(__dirname, 'tmp', `${theme}`), bigFile);
            execSync(`sh ${join(__dirname, 'scripts', `less.sh -t=${theme} -n=${cssName}`)}`);
            steelSheetsFiles[cssName] = { theme };
        });
    }
});

task('babel', ['concat-develop'], function () {
    return gulp.src(bundlePath)
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
        .pipe(gulp.dest(tmpJsPath))
        .on('end', () => {
            writeFileSync(bundlePath, `(function () {${readFileSync(bundlePath, 'utf8')}})()`);
        });
});

task('uglify', ['babel', 'templates'], function (done) {
    const PATH_HASH = {
        bin: join(__dirname, 'node_modules', '.bin', 'uglifyjs'),
        out: join(__dirname, 'dist', 'tmp', 'js')
    };
    const run = function (path, name) {
        return new Promise((resolve, reject) => {
            exec(`${PATH_HASH.bin} ${path} -o ${join(PATH_HASH.out, name)}`, (err, l1, l2) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    Promise.all([
        run(bundlePath, getFileName(bundleName, 'min')),
        run(templatePath, getFileName(templatesName, 'min'))
    ]).then(() => done());
});

task('zip', configurations.map(name => `zip-${name}`));

task('concat-develop', [
    'concat-develop-sources',
    'concat-develop-vendors'
]);

task('build-main', getTasksFrom('build', taskHash.concat, taskHash.copy, taskHash.html));

task('concat', taskHash.concat.concat('concat-develop'));
task('electron-task-list', taskHash.forElectron);
task('copy', taskHash.copy);
task('html', taskHash.html);
task('zip', taskHash.zip);

task('electron-debug', function (done) {
    const root = join(__dirname, 'dist', 'desktop', 'electron-debug');
    const srcDir = join(__dirname, 'electron');

    const copyItem = name => copy(join(srcDir, name), join(root, name));
    const makePackageJSON = () => {
        const targetPackage = Object.create(null);

        meta.electron.createPackageJSONFields.forEach((name) => {
            targetPackage[name] = pack[name];
        });

        Object.assign(targetPackage, meta.electron.defaults);
        targetPackage.server = 'localhost:8080';

        return writeFile(join(root, 'package.json'), JSON.stringify(targetPackage));
    };

    const excludeTypeScrip = list => list.filter(name => extname(name) !== '.ts');

    const copyNodeModules = () => Promise.all(meta.copyNodeModules.map(name => copy(name, join(root, name))));
    const copyI18next = () => copy(join(__dirname, 'node_modules', 'i18next', 'dist'), join(root, 'i18next'));
    readdir(srcDir)
        .then(excludeTypeScrip)
        .then(list => Promise.all(list.map(copyItem)))
        .then(makePackageJSON)
        .then(() => getLocales(root, { include_tags: ['electron'] }))
        .then(copyNodeModules)
        .then(copyI18next)
        .then(() => done());
});

task('data-service', function () {
    execSync('npm run data-service');
});

task('all', [
    'clean',
    'data-service',
    'templates',
    'concat',
    'copy',
    'html',
    'electron-task-list',
    'electron-debug',
    'zip'
]);

function filterTask(forFind: string) {
    return (item) => {
        return item.includes(forFind);
    };
}

function getTasksFrom(filter: string, ...tasks: Array<Array<string>>): Array<string> {
    const processor = filterTask(filter);
    return tasks.reduce((result, taskList) => {
        result = result.concat(taskList.filter(processor));
        return result;
    }, []);
}
