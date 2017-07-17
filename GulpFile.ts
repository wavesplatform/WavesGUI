import * as gulp from 'gulp';
import * as templateCache from 'gulp-angular-templatecache';
import * as concat from 'gulp-concat';
import * as babel from 'gulp-babel';
import * as uglify from 'gulp-uglify';
import * as rename from 'gulp-rename';
import * as copy from 'gulp-copy';
const zip = require('gulp-zip');
import { getFilesFrom, replaceScripts, replaceStyles, run } from './ts-scripts/utils';
import { relative } from 'path';
import { readJSONSync, outputFile, readFile, copy as fsCopy } from 'fs-extra';

import { IMteaJSON, IPackageJSON } from './ts-scripts/interface';


const meta: IMteaJSON = readJSONSync('ts-scripts/meta.json');
const pack: IPackageJSON = readJSONSync('package.json');
const configurations = Object.keys(meta.configurations);

const sourceFiles = getFilesFrom('./src/js', '.js', function (name, path) {
    return !name.includes('.spec') && !path.includes('/test/');
});


function moveTo(path: string): (relativePath: string) => string {
    return function (relativePath: string): string {
        return relative(path, relativePath);
    }
}

gulp.task('up-bower-json')

(gulp as any).task('templates', ['clean'], function () {
    return gulp.src('src/templates/**/*.html')
        .pipe(templateCache({
            module: 'app',
            transformUrl: function (url) {
                return url.replace('.html', '');
            }
        }))
        .pipe(gulp.dest('dist/dev/js'));
});

configurations.forEach((configName) => {
    const name = meta.configurations[configName].name;
    const jsName = `${pack.name}-${name}-${pack.version}.js`;
    const indexPromise = readFile('src/index.html', {encoding: 'utf8'});

    (gulp as any).task(`concat-${configName}`, ['uglify'], function () {
        return gulp.src(['dist/dev/js/vendors.js', 'dist/dev/js/bundle.min.js'])
            .pipe(concat(jsName))
            .pipe(gulp.dest(`dist/${name}/js`));
    });

    (gulp as any).task(`html-${configName}`, ['clean', `concat-${configName}`], function (done) {
        indexPromise.then((file) => {
            const filter = moveTo(`./dist/${name}`);

            file = replaceStyles(file, [`dist/${name}/css/${pack.name}-styles-${pack.version}.css`].map(filter));
            file = replaceScripts(file, [`dist/${name}/js/${jsName}`].map(filter));

            outputFile(`./dist/${name}/index.html`, file).then(done);
        });
    });

    (gulp as any).task(`copy-${configName}`, ['concat-style'], function (done) {
        let forCopy = [];

        if (configName.includes('chrome')) {
            forCopy = [
                fsCopy('src/chrome', `dist/${name}`)
            ];
        } else if (configName.includes('desktop')) {
            forCopy = [
                fsCopy('src/desktop', `dist/${name}`)
            ];
        } else {
            forCopy = [];
        }

        Promise.all([
            fsCopy(`dist/${pack.name}-styles-${pack.version}.css`, `dist/${name}/css/${pack.name}-styles-${pack.version}.css`),
            fsCopy('src/fonts', `dist/${name}/fonts`),
            fsCopy('LICENSE', `dist/${name}/LICENSE`),
            fsCopy('3RD-PARTY-LICENSES.txt', `dist/${name}/3RD-PARTY-LICENSES.txt`),
            fsCopy('src/img', `dist/${name}/img`)
        ].concat(forCopy)).then(() => {
            done();
        }, (e) => {
            console.log(e.message);
        });
    });

    (gulp as any).task(`zip-${configName}`, [
        `concat-${configName}`,
        `html-${configName}`,
        `copy-${configName}`
    ], function () {
        return gulp.src(`dist/${name}/**/*.*`)
            .pipe(zip(`${pack.name}-${name}-v${pack.version}.zip`))
            .pipe(gulp.dest('dist'));
    })

});

(gulp as any).task('concat-style', ['less'], function () {
    const target = `${pack.name}-styles-${pack.version}.css`;
    return gulp.src(meta.stylesheets)
        .pipe(concat(target))
        .pipe(gulp.dest('dist/'))
});

gulp.task('concat-develop-sources', function () {
    return gulp.src(sourceFiles)
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('dist/dev/js/'));
});

gulp.task('concat-develop-vendors', function () {
    return gulp.src(meta.vendors)
        .pipe(concat('vendors.js'))
        .pipe(gulp.dest('dist/dev/js/'));
});

gulp.task('clean', function (done) {
    run('sh', ['scripts/clean.sh']).then(done);
});

gulp.task('eslint', function (done) {
    run('sh', ['scripts/eslint.sh']).then(done);
});

(gulp as any).task('less', ['clean'], function (done) {
    run('sh', ['scripts/less.sh']).then(done);
});

(gulp as any).task('babel', ['concat-develop'], function () {
    return gulp.src('dist/dev/js/bundle.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('dist/dev/js'));
});

(gulp as any).task('uglify', ['babel'], function () {
    return gulp.src('dist/dev/js/bundle.js')
        .pipe(uglify())
        .pipe(rename('bundle.min.js'))
        .pipe(gulp.dest('dist/dev/js'));
});

(gulp as any).task('html-develop', ['clean'], function (done) {
    readFile('src/index.html', {encoding: 'utf8'}).then((file) => {
        const filter = moveTo('./dist/dev');
        const files = ['dist/dev/js/vendors.js'].concat(sourceFiles, './dist/dev/js/templates.js').map(filter);

        file = replaceStyles(file, meta.stylesheets.map(filter));
        file = replaceScripts(file, files);

        outputFile('./dist/dev/index.html', file).then(done);
    });
});


(gulp as any).task('copy-fonts', ['clean'], function () {
    return gulp.src('src/fonts/**/*.*')
        .pipe(copy('dist/dev', {prefix: 1}));
});

(gulp as any).task('copy-img', ['clean'], function () {
    return gulp.src('src/img/**/*.*')
        .pipe(copy('dist/dev', {prefix: 1}));
});

(gulp as any).task('copy-develop', [
    'clean',
    'copy-fonts',
    'copy-img'
]);

gulp.task('concat-develop', [
    'clean',
    'concat-develop-sources',
    'concat-develop-vendors'
] as any);

(gulp as any).task('copy', configurations.map(name => `copy-${name}`).concat('copy-develop'));
(gulp as any).task('html', configurations.map(name => `html-${name}`).concat('html-develop'));
gulp.task('concat', configurations.map(name => `concat-${name}`).concat('concat-style') as any);
gulp.task('zip', configurations.map(name => `zip-${name}`) as any);

(gulp as any).task('build-local', [
    'clean',
    'less',
    'templates',
    'concat-develop-vendors',
    'copy-develop',
    'html-develop'
]);

(gulp as any).task('all', [
    'clean',
    'concat',
    'copy',
    'html',
    'zip'
]);
