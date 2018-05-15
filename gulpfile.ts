import * as gulp from 'gulp';
import * as concat from 'gulp-concat';
import * as babel from 'gulp-babel';
import { exec, execSync } from 'child_process';
import { download, getFilesFrom, prepareHTML, run, task } from './ts-scripts/utils';
import { basename, join, sep } from 'path';
import { copy, mkdirp, outputFile, readdir, readFile, readJSON, readJSONSync, writeFile, writeJSON } from 'fs-extra';
import { IMetaJSON, IPackageJSON, TBuild, TConnection, TPlatform } from './ts-scripts/interface';
import * as templateCache from 'gulp-angular-templatecache';
import * as htmlmin from 'gulp-htmlmin';

const zip = require('gulp-zip');
const s3 = require('gulp-s3');

const meta: IMetaJSON = readJSONSync(join(__dirname, 'ts-scripts', 'meta.json'));
const pack: IPackageJSON = readJSONSync(join(__dirname, 'package.json'));
const configurations = Object.keys(meta.configurations);
const AWS = {
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'eu-central-1'
};

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
const vendorPath = join(tmpJsPath, vendorName);
const bundlePath = join(tmpJsPath, bundleName);
const templatePath = join(tmpJsPath, templatesName);
const cssPath = join(tmpCssPath, cssName);

const getFileName = (name, type) => {
    const postfix = type === 'min' ? '.min' : '';
    return `${name.replace('.js', '')}${postfix}.js`;
};


const indexPromise = readFile(join(__dirname, 'src', 'index.html'), { encoding: 'utf8' });

task('load-trading-view', (done) => {
    Promise.all(meta.tradingView.files.map((relativePath) => {
        const url = `${meta.tradingView.domain}/${relativePath}`;
        return download(url, join(__dirname, 'dist', 'tmp', 'trading-view', relativePath)).then(() => {
            console.log(`Download "${relativePath}" done`);
        });
    })).then(() => done());
});

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

            const copyDeps = ['concat-style'];
            if (buildName === 'desktop') {
                copyDeps.push('load-trading-view');
            }

            task(`copy-${taskPostfix}`, copyDeps, function (done) {
                    const reg = new RegExp(`(.*?\\${sep}src)`);
                    let forCopy = JSON_LIST.map((path) => {
                        return copy(path, path.replace(reg, `${targetPath}`));
                    }).concat(copy(join(__dirname, 'src/fonts'), `${targetPath}/fonts`));

                    if (buildName === 'desktop') {
                        const electronFiles = getFilesFrom(join(__dirname, 'electron'), '.js');
                        electronFiles.forEach((path) => {
                            const name = basename(path);
                            forCopy.push(copy(path, join(targetPath, name)));
                        });
                        forCopy.push(copy(join(__dirname, 'electron', 'icons'), join(targetPath, 'img', 'icon.png')));
                        forCopy.push(copy(join(__dirname, 'dist', 'tmp', 'trading-view'), join(targetPath, 'trading-view')));
                    }

                    Promise.all([
                        Promise.all(meta.copyNodeModules.map((path) => {
                            return copy(join(__dirname, path), `${targetPath}/${path}`);
                        })) as Promise<any>,
                        copy(join(__dirname, 'src/img'), `${targetPath}/img`).then(() => {
                            const images = IMAGE_LIST.map((path) => path.replace(reg, ''));
                            return writeFile(join(targetPath, 'img', 'images-list.json'), JSON.stringify(images));
                        }),
                        copy(cssPath, join(targetPath, 'css', cssName)),
                        copy('LICENSE', join(`${targetPath}`, 'LICENSE')),
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

                if (buildName === 'desktop') {
                    meta.electronScripts.forEach((fileName) => {
                        scripts.push(join(targetPath, fileName));
                    });
                }

                indexPromise.then((file) => {
                    return prepareHTML({
                        buildType: type,
                        target: targetPath,
                        connection: configName,
                        scripts: scripts,
                        styles: [
                            join(targetPath, 'css', `${pack.name}-styles-${pack.version}.css`)
                        ],
                        type: buildName
                    });
                }).then((file) => {
                    console.log('out ' + configName);
                    outputFile(`${targetPath}/index.html`, file).then(() => done());
                });
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
    return gulp.src('src/!(index.html)/**/*.html')
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(templateCache({
            module: 'app.templates',
            // transformUrl: function (url) {
            //     return `/${url}`;
            // }
        }))
        .pipe(gulp.dest(tmpJsPath));
});

task('concat-style', ['less'], function () {
    return gulp.src(meta.stylesheets.concat(join(tmpCssPath, 'style.css')))
        .pipe(concat(cssName))
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

task('clean', function () {
    execSync('sh scripts/clean.sh');
});

task('eslint', function (done) {
    run('sh', ['scripts/eslint.sh']).then(() => done());
});

task('less', function () {
    execSync(`sh ${join('scripts', 'less.sh')}`);
});

task('babel', ['concat-develop'], function () {
    return gulp.src(bundlePath)
        .pipe(babel({
            presets: ['es2015'],
            plugins: [
                'transform-decorators-legacy',
                'transform-class-properties',
                'transform-decorators',
                'transform-object-rest-spread'
            ]
        }))
        .pipe(gulp.dest(tmpJsPath));
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

task('s3-testnet', function () {
    const bucket = 'testnet.waveswallet.io';
    return gulp.src('./dist/testnet/**/*')
        .pipe(s3({ ...AWS, bucket }));
});

task('s3-mainnet', function () {
    const bucket = 'waveswallet.io';
    return gulp.src('./dist/mainnet/**/*')
        .pipe(s3({ ...AWS, bucket }));
});

task('s3', ['s3-testnet', 's3-mainnet']);

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

task('electron-debug', ['electron-task-list'], function (done) {
    const root = join(__dirname, 'dist', 'desktop');

    const process = function (to: string) {
        const promise = readdir(join(__dirname, 'electron'))
            .then((list) => list.filter((name) => name.indexOf('js') !== -1))
            .then((list) => list.map((name) => copy(join(__dirname, 'electron', name), join(to, name))))
            .then((list) => Promise.all(list))
            .then(() => readJSON(join(__dirname, 'dist', 'desktop', 'mainnet', 'normal', 'package.json')))
            .then((pack) => {
                pack.server = `localhost:8080`;
                return writeFile(join(to, 'package.json'), JSON.stringify(pack, null, 4));
            });

        return promise;
    };


    const copyTo = join(root, 'electron-debug');
    process(copyTo)
        .then(() => done())
        .catch((e) => console.log(e.stack));
});

task('all', [
    'clean',
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
