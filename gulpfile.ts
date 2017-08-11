import * as gulp from 'gulp';
import * as templateCache from 'gulp-angular-templatecache';
import * as concat from 'gulp-concat';
import * as babel from 'gulp-babel';
import * as uglify from 'gulp-uglify';
import * as rename from 'gulp-rename';
import * as copy from 'gulp-copy';
import * as htmlmin from 'gulp-htmlmin';
import { getFilesFrom, replaceNetworkConfig, replaceScripts, replaceStyles, run, task } from './ts-scripts/utils';
import { join, relative } from 'path';
import { copy as fsCopy, outputFile, readFile, readJSON, readJSONSync } from 'fs-extra';
import { IConfItem, IMetaJSON, IPackageJSON } from './ts-scripts/interface';

const zip = require('gulp-zip');
const s3 = require('gulp-s3');

const meta: IMetaJSON = readJSONSync('ts-scripts/meta.json');
const pack: IPackageJSON = readJSONSync('package.json');
const configurations = Object.keys(meta.configurations);
const AWS = {
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'eu-central-1'
};

const sourceFiles = getFilesFrom('./src/js', '.js', function (name, path) {
    return !name.includes('.spec') && !path.includes('/test/');
});


function moveTo(path: string): (relativePath: string) => string {
    return function (relativePath: string): string {
        return relative(path, relativePath);
    }
}

function getConfigFile(name: string, config: IConfItem): string {
    return `var WAVES_NETWORK_CONF = ${JSON.stringify({
        name,
        code: config.code,
        version: pack.version,
        server: config.server,
        matcher: config.matcher,
        coinomat: config.coinomat,
        datafeed: config.datafeed
    })};
    `;
}

const taskHash = {
    concat: [],
    html: [],
    copy: [],
    zip: []
};

const tmpJsPath = './dist/tmp/js';
const tmpCssPath = './dist/tmp/css';
const vendorName = 'vendors.js';
const bundleName = 'bundle.js';
const templateName = 'templates.js';
const cssName = `${pack.name}-styles-${pack.version}.css`;
const vendorPath = join(tmpJsPath, vendorName);
const bundlePath = join(tmpJsPath, bundleName);
const templatePath = join(tmpJsPath, templateName);
const cssPath = join(tmpCssPath, cssName);



const getFileName = (name, type) => {
    const postfix = type === 'min' ? '.min' : '';
    return `${name.replace('.js', '')}${postfix}.js`;
};


const indexPromise = readFile('src/index.html', { encoding: 'utf8' });

['build', 'chrome', 'desktop'].forEach((buildName) => {

    configurations.forEach((configName) => {

        const config = meta.configurations[configName];

        ['dev', 'normal', 'min'].forEach((type) => {

            const targetPath = `./dist/${buildName}/${configName}/${type}`;
            const jsFileName = getName(`${pack.name}-${buildName}-${configName}-${pack.version}.js`);
            const jsFilePath = join(targetPath, 'js', jsFileName);
            const taskPostfix = `${buildName}-${configName}-${type}`;


            if (type !== 'dev') {
                task(`concat-${taskPostfix}`, [type === 'min' ? 'uglify' : 'babel'], function (done) {
                    const stream = gulp.src([vendorPath, getName(bundlePath), templatePath])
                        .pipe(concat(jsFileName))
                        .pipe(gulp.dest(`${targetPath}/js`));

                    stream.on('end', function () {
                        readFile(`${targetPath}/js/${jsFileName}`, { encoding: 'utf8' }).then((file) => {
                            outputFile(`${targetPath}/js/${jsFileName}`, file)
                                .then(() => done());
                        });
                    });
                });
                taskHash.concat.push(`concat-${taskPostfix}`);
            }

            task(`copy-${taskPostfix}`, ['concat-style'], function (done) {
                let forCopy = [];

                if (buildName === 'chrome') {
                    forCopy = [
                        fsCopy('./src/chrome', targetPath)
                    ];
                } else if (buildName  === 'desktop') {
                    forCopy = [
                        fsCopy('src/desktop', targetPath)
                    ];
                } else if (type === 'dev') {
                    forCopy = [
                        fsCopy(templatePath, `${targetPath}/js/${templateName}`)
                    ]
                } else {
                    forCopy = [];
                }

                Promise.all([
                    fsCopy(cssPath, `${targetPath}/css/${pack.name}-styles-${pack.version}.css`),
                    fsCopy('src/fonts', `${targetPath}/fonts`),
                    fsCopy('LICENSE', `${targetPath}/LICENSE`),
                    fsCopy('3RD-PARTY-LICENSES.txt', `${targetPath}/3RD-PARTY-LICENSES.txt`),
                    fsCopy('src/img', `${targetPath}/img`)
                ].concat(forCopy)).then(() => {
                    done();
                }, (e) => {
                    console.log(e.message);
                });
            });
            taskHash.copy.push(`copy-${taskPostfix}`);


            const htmlDeps = type === 'dev' ? [] : [`concat-${taskPostfix}`];

            task(`html-${taskPostfix}`, htmlDeps.concat(['templates', `copy-${taskPostfix}`]), function (done) {
                indexPromise.then((file) => {
                    const filter = moveTo(targetPath);

                    file = replaceStyles(file, [`${targetPath}/css/${pack.name}-styles-${pack.version}.css`].map(filter));
                    if (type === 'dev') {
                        file = replaceScripts(file, meta.vendors.concat(sourceFiles, `${targetPath}/js/${templateName}`).map(filter));
                    } else {
                        file = replaceScripts(file, [jsFilePath].map(filter));
                    }

                    file = replaceNetworkConfig(file, getConfigFile(`${bundleName}-${configName}`, config));
                    outputFile(`${targetPath}/index.html`, file).then(() => done());
                });
            });
            taskHash.html.push(`html-${taskPostfix}`);

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
        './bower.json',
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
    return gulp.src('src/templates/**/*.html')
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(templateCache({
            module: 'app',
            transformUrl: function (url) {
                return url.replace('.html', '');
            }
        }))
        .pipe(gulp.dest(tmpJsPath));
});

task('concat-style', ['less'], function () {
    return gulp.src(meta.stylesheets.concat(join(tmpCssPath, 'style.css')))
        .pipe(concat(cssName))
        .pipe(gulp.dest(tmpCssPath))
});

task('concat-develop-sources', function () {
    return gulp.src(sourceFiles)
        .pipe(concat(bundleName))
        .pipe(gulp.dest(tmpJsPath));
});

task('concat-develop-vendors', function () {
    return gulp.src(meta.vendors)
        .pipe(concat(vendorName))
        .pipe(gulp.dest(tmpJsPath));
});

task('clean', function (done) {
    run('sh', ['scripts/clean.sh']).then(() => done());
});

task('eslint', function (done) {
    run('sh', ['scripts/eslint.sh']).then(() => done());
});

task('less', function (done) {
    run('sh', ['scripts/less.sh']).then(() => done());
});

task('babel', ['concat-develop'], function () {
    return gulp.src(bundlePath)
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(tmpJsPath));
});

task('uglify', ['babel'], function () {
    return gulp.src(bundlePath)
        .pipe(uglify())
        .pipe(rename(getFileName(bundlePath, 'min')))
        .pipe(gulp.dest('./'));
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
task('copy', taskHash.copy);
task('html', taskHash.html);
task('zip', taskHash.zip);

task('all', [
    'clean',
    'concat',
    'copy',
    'html',
    'zip'
]);

function filterTask(forFind: string) {
    return (item) => {
        return item.includes(forFind);
    }
}

function getTasksFrom(filter: string, ...tasks: Array<Array<string>>): Array<string> {
    const processor = filterTask(filter);
    return tasks.reduce((result, taskList) => {
        result = result.concat(taskList.filter(processor));
        return result;
    }, []);
}
