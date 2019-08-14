import { readJSONSync } from 'fs-extra';
import { parallel, series, task } from 'gulp';
import { basename, extname, join, sep } from 'path';
import { options } from 'yargs';
import { createBabelTask } from './scripts/babelTask';
import { createCleanTask } from './scripts/cleanTask';
import { createConcatTask } from './scripts/concatTask';
import { createCopyTask } from './scripts/copyTask';
import { createDataServicesTask } from './scripts/dataServicesTask';
import { createElectronDebugTask } from './scripts/electronDebugTask';
import { createElectronPackageTask } from './scripts/electronPackageTask';
import { createEslintTask } from './scripts/eslintTask';
import { createHtmlTask } from './scripts/htmlTask';
import { createImageListTask } from './scripts/imageListTask';
import { createLessTask } from './scripts/lessTask';
import { createLocalesTask } from './scripts/localesTask';
import { createTemplatesTask } from './scripts/templatesTask';
import { IMetaJSON, IPackageJSON, TBuild, TConnection, TPlatform } from './ts-scripts/interface';
import { getFilesFrom } from './ts-scripts/utils';

const getFileName = (name: string, env: TBuild) => {
    const postfix = env === 'production' ? '.min' : '';

    return name.replace(/\.(js|css)/, `${postfix}.$1`);
};

function createBuildTask(args?: { platform: TPlatform; env: TBuild; config: string }) {
    const { platform, env, config } = args || options({
        platform: {
            type: 'string',
            alias: 'p',
            choices: ['web', 'desktop'],
            default: 'web'
        },
        env: {
            type: 'string',
            alias: 'e',
            choices: ['development', 'production'],
            default: 'production'
        },
        config: {
            type: 'string',
            alias: 'c',
            default: './configs/mainnet.json'
        }
    }).argv;

    const configName = basename(config, extname(config));
    const distPath = 'dist';
    const outputPath = join(distPath, platform, configName);
    const reg = new RegExp(`(.*?\\${sep}?src)`);

    const pack: IPackageJSON = readJSONSync('package.json');
    const meta: IMetaJSON = readJSONSync(join('ts-scripts', 'meta.json'));
    const { themes } = readJSONSync(join('src', 'themeConfig', 'theme.json'));
    const SOURCE_IMAGE_LIST = getFilesFrom(
        join('src', 'img'),
        ['.png', '.svg', '.jpg'],
        (name, path) => path.indexOf('no-preload') === -1
    );
    const SOURCE_JSON_LIST = getFilesFrom(join('src'), '.json');

    return series(
        parallel(
            createTemplatesTask(
                ['src/**/*.html', 'src/!(index.hbs)/**/*.hbs'],
                join(outputPath, 'js'),
                {
                    module: 'app.templates',
                    standalone: true,
                    transformUrl(url: string) {
                        return (url.startsWith('/') || url.startsWith('\\')) ? url.slice(1) : url;
                    },
                    filename: getFileName('templates.js', env as TBuild)
                }
            ),
            createConcatTask(
                getFileName('vendors.js', env as TBuild),
                meta.vendors,
                join(outputPath, 'js'),
                platform === 'desktop'
                    ? ['(function () {\nvar module = undefined;\n', '})();']
                    : null
            ),
            createConcatTask(
                getFileName('not-wrapped-vendors.js', env as TBuild),
                meta.vendorsNotWrapped,
                join(outputPath, 'js')
            ),
            createConcatTask(
                getFileName('vendor-styles.css', env as TBuild),
                meta.stylesheets,
                join(outputPath, 'css')
            ),
            createBabelTask(
                getFileName('bundle.js', env as TBuild),
                'src/modules/**/*.js',
                join(outputPath, 'js')
            ),
            parallel(
                themes.map(theme => createLessTask(
                    getFileName(`${theme}-styles.css`, env as TBuild),
                    'src/modules/**/*.less',
                    join(outputPath, 'css'),
                    { paths: [join('src', 'themeConfig', theme)] }
                ))
            )
        ),
        createLocalesTask(join(__dirname, distPath)),
        createCopyTask([
            ...SOURCE_JSON_LIST.map(path => ({ from: path, to: path.replace(reg, outputPath) })),
            ...meta.exportPageVendors.map(path => ({ from: path, to: join(outputPath, path) })),
            ...meta.copyNodeModules.map(path => ({ from: join(path), to: join(outputPath, path) })),
            { from: join('src', 'fonts'), to: join(outputPath, 'fonts') },
            { from: join(distPath, 'locale'), to: join(outputPath, 'locales') },
            { from: 'tradingview-style', to: join(outputPath, 'tradingview-style') },
            { from: 'LICENSE', to: join(outputPath, 'LICENSE') },
            { from: 'googleAnalytics.js', to: join(outputPath, 'googleAnalytics.js') },
            { from: 'amplitude.js', to: join(outputPath, 'amplitude.js') },
            { from: join('src', 'img'), to: join(outputPath, 'img') },
            ...(platform === 'desktop' ? [
                ...getFilesFrom(join('electron'), '.js').map(path => ({ from: path, to: join(outputPath, basename(path)) })),
                { from: join('electron', 'icons'), to: join(outputPath, 'img', 'icon.png') },
                { from: join('electron', 'waves.desktop'), to: join(outputPath, 'waves.desktop') },
                { from: join('node_modules', 'i18next', 'dist'), to: join(outputPath, 'i18next') }
            ] : [])
        ]),
        createImageListTask(SOURCE_IMAGE_LIST, join(outputPath, 'img', 'images-list.json'), reg),
        createHtmlTask({
            target: outputPath,
            buildType: env as TBuild,
            connection: configName as TConnection,
            type: platform as TPlatform,
            outerScripts: [
                '<script>Sentry.init({ dsn: "https://edc3970622f446d7aa0c9cb38be44a4f@sentry.io/291068" });<\/script>'
            ],
            scripts: [
                ...(platform === 'desktop' ?
                    meta.electronScripts.map(fileName => join(outputPath, fileName)) :
                    []
                )
            ],
            styles: [],
            themes,
            networkConfigFile: config
        }),
        createElectronPackageTask(outputPath, platform as TPlatform, meta, pack)
    );
}

task('build', series(
    createCleanTask(),
    createDataServicesTask(),
    createBuildTask()
));

task('eslint', createEslintTask());

task('clean', createCleanTask());

task('data-services', createDataServicesTask());

task('electron-debug', createElectronDebugTask());

task('all', series(
    createCleanTask(),
    createDataServicesTask(),
    createBuildTask({ platform: 'web', env: 'production', config: './configs/mainnet.json' }),
    createBuildTask({ platform: 'web', env: 'production', config: './configs/testnet.json' }),
    createBuildTask({ platform: 'desktop', env: 'production', config: './configs/mainnet.json' }),
    createBuildTask({ platform: 'desktop', env: 'production', config: './configs/testnet.json' })
));
