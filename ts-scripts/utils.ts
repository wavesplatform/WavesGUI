import * as gulp from 'gulp';
import { getType } from 'mime';
import { exec, spawn } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync, unlink } from 'fs';
import { join, relative, extname, dirname } from 'path';
import { IPackageJSON, IMetaJSON, ITaskFunction, TBuild, TConnection, TPlatform } from './interface';
import { readFile, readJSON, readJSONSync, createWriteStream, mkdirpSync, copy } from 'fs-extra';
import { compile } from 'handlebars';
import { transform } from 'babel-core';
import { render } from 'less';
import { minify } from 'html-minifier';
import { get, ServerResponse, IncomingMessage, request } from 'https';
import { MAINNET_DATA, TESTNET_DATA } from '@waves/assets-pairs-order';

const extract = require('extract-zip');

declare const parseJsonBignumber;
declare const BigNumber;
declare const WavesApp;
declare const ds;
declare const parse;
declare const Mousetrap;
declare const MobileDetect;
declare const transfer;

export const task: ITaskFunction = gulp.task.bind(gulp) as any;

export function getBranch(): Promise<string> {
    return new Promise((resolve, reject) => {
        const command = 'git symbolic-ref --short HEAD';
        exec(command, { encoding: 'utf8' }, (error: Error, stdout: string, stderr: string) => {
            if (error) {
                console.log(stderr);
                console.log(error);
                reject(error);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

export function getBranchDetail(): Promise<{ branch: string; project: string; ticket: number; description: string }> {
    return getBranch().then((branch) => {
        const parts = branch.split('-');
        const [project, ticket] = parts;
        const description = parts.slice(2).join(' ');
        return { branch, project: project.toUpperCase(), ticket: Number(ticket), description };
    });
}

export function getFilesFrom(dist: string, extension?: string | Array<string>, filter?: IFilter): Array<string> {
    const files = [];

    function read(localPath) {
        const result = readdirSync(localPath);
        const forRead = [];

        result.sort();
        result.forEach(function (itemName) {
            const itemPath = join(localPath, itemName);
            if (statSync(itemPath).isDirectory()) {
                forRead.push(itemPath);
            } else {
                if (Array.isArray(extension)) {
                    const isNeedFile = extension.some((ext) => {
                        return isEqualExtension(itemName, ext);
                    });
                    if (isNeedFile) {
                        if (!filter || filter(itemName, itemPath)) {
                            files.push(itemPath);
                        }
                    }
                } else if (extension) {
                    if (isEqualExtension(itemName, extension)) {
                        if (!filter || filter(itemName, itemPath)) {
                            files.push(itemPath);
                        }
                    }
                } else {
                    if (!filter || filter(itemName, itemPath)) {
                        files.push(itemPath);
                    }
                }
            }
        });

        forRead.forEach(read);
    }

    read(dist);

    return files;
}

export function isEqualExtension(fileName: string, extension: string): boolean {
    return extname(fileName).replace('.', '') === extension.replace('.', '');
}

export function run(command: string, args: Array<string>, noLog?: boolean): Promise<{ code: number; data: string[] }> {
    return new Promise((resolve) => {
        const task = spawn(command, args);
        const data = [];

        task.stdout.on('data', (message: Buffer) => {
            const value = String(message);
            data.push(value);
            if (!noLog) {
                console.log(value);
            }
        });

        task.stderr.on('data', (data: Buffer) => {
            if (!noLog) {
                console.log(String(data));
            }
        });

        task.on('close', (code: number) => {
            resolve({ code, data });
        });
    });
}

export function moveTo(path: string): (relativePath: string) => string {
    return function (relativePath: string): string {
        return relative(path, relativePath);
    };
}

export function replaceScripts(file: string, paths: Array<string>): string {
    return file.replace('<!-- JAVASCRIPT -->',
        paths.map((path) => `<script src="${ path }"></script>`).join('\n')
    );
}

export function replaceStyles(file: string, paths: Array<{ theme: string, name: string, hasGet?: boolean }>): string {
    return file.replace('<!-- CSS -->', paths.map(({ theme, name, hasGet }) => {
        if (hasGet) {
            return `<link ${ theme ? `theme="${ theme }"` : '' } rel="stylesheet" href="${ name }?theme=${ theme || '' }">`;
        }

        return `<link ${ theme ? `theme="${ theme }"` : '' } rel="stylesheet" href="${ name }">`;
    }).join('\n'));
}

export function isTradingView(url: string): boolean {
    return url.indexOf('/trading-view') !== -1;
}

export function getAllLessFiles() {
    return getFilesFrom(join(__dirname, '../src'), '.less');
}

export function getScripts(param: IPrepareHTMLOptions, pack, meta) {
    const filter = moveTo(param.target);
    let { scripts } = param || Object.create(null);
    if (!scripts) {
        const sourceFiles = getFilesFrom(join(__dirname, '../src'), '.js', function (name, path) {
            return !name.includes('.spec') && !path.includes('/test/');
        });
        const cacheKiller = `?v${ pack.version }`;
        scripts = meta.vendors.map((i) => join(__dirname, '..', i)).concat(sourceFiles);
        meta.debugInjections.forEach((path) => {
            scripts.unshift(join(__dirname, '../', path));
        });
        scripts = scripts.map((path) => `${ path }${ cacheKiller }`);
    }
    return scripts.map(filter).map(path => `<script src="${ path }"></script>`);
}

export function getStyles(param: IPrepareHTMLOptions, meta, themes) {
    const filter = moveTo(param.target);
    let { styles } = param || Object.create(null);

    if (!styles) {
        const _styles = meta.stylesheets.concat(getFilesFrom(join(__dirname, '../src'), '.less'));
        styles = [];
        for (const style of _styles) {
            for (const theme of themes) {
                const name = filter(style);

                if (!isLess(style)) {
                    styles.push({ name: `/${ name }`, theme: null });
                    break;
                }
                styles.push({ name: `/${ name }`, theme, hasGet: true });
            }
        }
    }

    return styles.map(({ theme, name, hasGet }) => {
        if (hasGet) {
            return `<link ${ theme ? `theme="${ theme }"` : '' } rel="stylesheet" href="${ name }?theme=${ theme || '' }">`;
        }

        return `<link ${ theme ? `theme="${ theme }"` : '' } rel="stylesheet" href="${ name }">`;
    });
}

export async function getBuildParams(param: IPrepareHTMLOptions) {
    const [pack, meta, themesConf] = await Promise.all([
        readJSON(join(__dirname, '../package.json')) as Promise<IPackageJSON>,
        readJSON(join(__dirname, './meta.json')) as Promise<IMetaJSON>,
        readJSON(join(__dirname, '../src/themeConfig/theme.json'))
    ]);

    const { themes } = themesConf;
    const { domain } = meta;
    const { connection, type, buildType, outerScripts = [] } = param;
    const config = meta.configurations[connection];

    const networks = ['mainnet', 'testnet'].reduce((result, connection) => {
        result[connection] = meta.configurations[connection];
        return result;
    }, Object.create(null));

    const scripts = getScripts(param, pack, meta).concat(outerScripts);
    const styles = getStyles(param, meta, themes);
    const isWeb = type === 'web';
    const isProduction = buildType && buildType === 'min';
    const matcherPriorityList = connection === 'mainnet' ? MAINNET_DATA : TESTNET_DATA;
    const { origin, oracle, feeConfigUrl, bankRecipient } = config;

    return {
        pack,
        isWeb,
        origin,
        oracle,
        domain,
        styles,
        scripts,
        isProduction,
        feeConfigUrl,
        bankRecipient,
        build: { type },
        matcherPriorityList,
        network: networks[connection],
        themesConf: themesConf,
        langList: meta.langList,
    };
}

export function prepareHTML(param: IPrepareHTMLOptions): Promise<string> {
    const pFile = readFile(join(__dirname, '../src/index.hbs'), 'utf8');
    const pConfig = getBuildParams(param);
    return Promise.all([pFile, pConfig]).then(([file, config]) => compile(file)(config));
}

export function download(url: string, filePath: string): Promise<void> {
    return new Promise<void>((resolve) => {

        const cachePath = join(process.cwd(), '.cache-download', filePath.replace(process.cwd(), ''));
        if (existsSync(cachePath)) {
            copy(cachePath, filePath).then(resolve);
        } else {

            try {
                mkdirpSync(dirname(filePath));
            } catch (e) {
                console.log(e);
            }

            const file = createWriteStream(filePath);

            get(url, (response) => {
                response.pipe(file);
                response.on('end', () => copy(filePath, cachePath).then(resolve));
            });
        }
    });
}

export function parseArguments<T>(): T {
    const result = Object.create(null);
    process.argv.forEach((argument) => {
        if (argument.includes('=')) {
            const index = argument.indexOf('=');
            const name = argument.substr(0, index);
            const value = argument.substr(index + 1);
            result[name] = value;
        } else {
            result[argument] = true;
        }
    });
    return result;
}

export async function getInitScript(connectionType: TConnection, buildType: TBuild, type: TPlatform, paramsIn?) {
    const params = paramsIn || {
        target: join(__dirname, '..', 'src'),
        connection: connectionType,
        type,
    };

    const config = await getBuildParams(params);

    function initConfig(config) {
        var global = (window) as any;
        var __controllers = Object.create(null);

        global.buildIsWeb = config.isWeb;
        global.isDesktop = !config.isWeb;

        var USE_NATIVE_API = [
            global.Promise,
            global.fetch,
            Object.values,
            Object.assign,
            Object.getOwnPropertyDescriptor,
            Object.entries,
            global.URL,
            global.crypto || global.msCrypto
        ];

        var isSupported = true;

        try {
            for (var i = 0; i < USE_NATIVE_API.length; i++) {
                if (!USE_NATIVE_API[i]) {
                    throw new Error('Not supported');
                }
            }
        } catch (e) {
            isSupported = false;
        }

        config.notSupportedSelector = '.not-supported-browser';

        (window as any).getConfig = function () {

            config.isBrowserSupported = function () {
                return isSupported;
            };

            config._initScripts = function () {
                if (!isSupported) {
                    return null;
                }
                for (var i = 0; i < config.scripts.length; i++) {
                    document.write(config.scripts[i]);
                }
            };

            config._initStyles = function () {
                for (var i = 0; i < config.styles.length; i++) {
                    document.write(config.styles[i]);
                }
            };

            config._initApp = function () {
                global.BigNumber = ds.wavesDataEntities.BigNumber;

                // Signed 64-bit integer.
                WavesApp.maxCoinsCount = new BigNumber('9223372036854775807');

                WavesApp.device = new MobileDetect(navigator.userAgent);

                (function () {
                    var wrapper = require('worker-wrapper');

                    var worker = wrapper.create({
                        libs: ['/node_modules/parse-json-bignumber/dist/parse-json-bignumber.min.js?v' + WavesApp.version]
                    });

                    worker.process(function () {
                        (self as any).parse = parseJsonBignumber().parse;
                    });

                    var stringify = parseJsonBignumber({ BigNumber: BigNumber }).stringify;
                    WavesApp.parseJSON = function (str) {
                        return worker.process(function (str) {
                            return parse(str);
                        }, str);
                    };

                    WavesApp.stringifyJSON = function () {
                        return stringify.apply(this, arguments);
                    };
                })();


                if (WavesApp.isDesktop()) {
                    var listenDevTools = false;
                    Mousetrap.bind('i d d q d', function () {
                        if (!listenDevTools) {
                            transfer('addDevToolsMenu');
                            listenDevTools = true;
                        }
                    });
                }

                global.Mousetrap.bind('c l e a n a l l', function () {
                    localStorage.clear();
                    if (WavesApp.isDesktop()) {
                        transfer('reload');
                    } else {
                        window.location.reload();
                    }
                });
            };

            config.getLocaleData = function () {
                return WavesApp.localize[global.i18next.language];
            };

            config.addController = function (name, controller) {
                __controllers[name] = controller;
            };

            config.getController = function (name) {
                return __controllers[name];
            };

            config.isWeb = function () {
                return config.build.type === 'web';
            };

            config.isDesktop = function () {
                return config.build.type === 'desktop';
            };

            config._isProduction = function () {
                return config.isProduction;
            };

            config.reload = function () {
                if (WavesApp.isDesktop()) {
                    transfer('reload');
                } else {
                    window.location.reload();
                }
            };

            config.remappedAssetNames = {};
            config.remappedAssetNames[config.network.assets.EUR] = 'Euro';
            config.remappedAssetNames[config.network.assets.USD] = 'US Dollar';
            config.remappedAssetNames[config.network.assets.TRY] = 'TRY';
            config.remappedAssetNames[config.network.assets.BTC] = 'Bitcoin';
            config.remappedAssetNames[config.network.assets.ETH] = 'Ethereum';

            return config;
        };
    }

    const func = initConfig.toString();
    const conf = JSON.stringify(config, null, 4);

    return `(${ func })(${ conf })`;
}

export function route(connectionType: TConnection, buildType: TBuild, type: TPlatform) {
    return function (req: IncomingMessage, res: ServerResponse) {
        const url = req.url.replace(/\?.*/, '');

        if (url.includes('/package.json')) {
            res.end(readFileSync(join(__dirname, '..', 'package.json')));
        } else if (isTradingView(url)) {
            get(`https://client.wavesplatform.com/${ url }`, (resp: IncomingMessage) => {
                let data = new Buffer('');

                // A chunk of data has been recieved.
                resp.on('data', (chunk: Buffer) => {
                    data = Buffer.concat([data, chunk]);
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    Object.keys(resp.headers).forEach((name) => {
                        if (name !== 'transfer-encoding' && name !== 'connection' && !res.getHeader(name)) {
                            res.setHeader(name, resp.headers[name]);
                        }
                    });
                    res.end(data);
                });
            });
            return null;
        }

        if (buildType !== 'dev') {
            if (isPage(req.url)) {
                const path = join(__dirname, '..', 'dist', type, connectionType, buildType, 'index.html');
                return readFile(path, 'utf8').then((file) => {
                    res.end(file);
                });
            }
            return routeStatic(req, res, connectionType, buildType, type);
        } else {
            if (buildType === 'dev' && req.url.includes('init.js')) {
                return getInitScript(connectionType, buildType, type).then((script) => {
                    res.end(script);
                });
            }
        }

        if (url.indexOf('/locales') === 0) {
            const [lang, ns] = url.replace('/locales/', '')
                .replace(/\?.*/, '')
                .replace('.json', '')
                .split('/');
            const cachePath = join(process.cwd(), '.cache-download', 'locale', lang, `${ ns }.json`);

            if (existsSync(cachePath)) {
                const data = readFileSync(cachePath);
                res.end(data);
            }
            return null;
        }

        if (url.indexOf('/img/images-list.json') !== -1) {
            res.setHeader('Content-Type', 'application/json');
            const images = getFilesFrom(
                join(__dirname, '../src/img'),
                ['.svg', '.png', '.jpg'],
                (name, path) => path.indexOf('no-preload') === -1
            ).map(moveTo(join(__dirname, '../src')));
            res.end(JSON.stringify(images));
            return null;
        }

        if (isPage(url)) {
            return prepareHTML({
                target: join(__dirname, '..', 'src'),
                connection: connectionType,
                type,
            }).then((file) => {
                res.end(file);
            });
        } else if (isTemplate(url)) {
            readFile(join(__dirname, '../src', url), 'utf8')
                .then((template) => {
                    const code = minify(template, {
                        collapseWhitespace: true // TODO @xenohunter check html minify options
                    });
                    res.end(code);
                });
        } else if (isLess(url)) {
            const theme = req.url.match(/theme=(.+),?/)[1];

            readFile(join(__dirname, '../src', url), 'utf8')
                .then((style) => {
                    (render as any)(style, {
                        filename: join(__dirname, '../src', url),
                        paths: join(__dirname, `../src/themeConfig/${ theme }`)
                    } as any)
                        .then(function (out) {
                            res.setHeader('Content-type', 'text/css');
                            res.end(out.css);
                        })
                        .catch((e) => {
                            console.error(e.message);
                            console.error(url);
                            res.statusCode = 500;
                            res.end(e.message);
                        });
                });
        } else if (isSourceScript(url)) {
            readFile(join(__dirname, '../src', url), 'utf8')
                .then((code) => {
                    const result = transform(code, {
                        presets: ['es2015'],
                        plugins: [
                            'transform-decorators-legacy',
                            'transform-class-properties',
                            'transform-decorators',
                            'transform-object-rest-spread',
                            'transform-async-to-generator'
                        ]
                    }).code;
                    return result;
                })
                .then((code) => res.end(code))
                .catch((e) => {
                    console.log(e.message, url);
                });
        } else if (isApiMock(url)) {
            mock(req, res, { connection: connectionType, meta: readJSONSync(join(__dirname, 'meta.json')) });
        } else {
            routeStatic(req, res, connectionType, buildType, type);
        }
    };
}

export function mock(req, res, params) {
    applyRoute(getRouter(), req, res, params);
}

export function getRouter() {
    const mocks = getFilesFrom(join(__dirname, '../api'), '.js');
    const routes = Object.create(null);
    mocks.forEach((path) => {
        routes[`/${ moveTo(join(__dirname, '..'))(path).replace('.js', '.json') }`] = require(path);
    });
    return routes;
}

export function applyRoute(route, req, res, options) {
    const url = req.url;
    const parts = url.split('/');
    const urls = Object.keys(route)
        .sort((a, b) => {
            const reg = /:/g;
            return (a.match(reg) || { length: 0 }).length - (b.match(reg) || { length: 0 }).length;
        })
        .map((url) => url.split('/'))
        .filter((routeParts) => routeParts.length === parts.length);

    let listener = null;
    let params = null;

    urls.some((routeParts) => {
        const urlParams = Object.create(null);
        const valid = routeParts.every((part, i) => {
            if (part.charAt(0) === ':') {
                urlParams[part.substr(1)] = parts[i];
                return true;
            } else {
                return part === parts[i];
            }
        });
        if (valid) {
            params = urlParams;
            listener = route[routeParts.join('/')];
        }
        return valid;
    });

    if (listener) {
        res.setHeader('Content-Type', 'application/json');
        listener(req, res, params, options);
    } else {
        res.end('Not found!');
    }
}

export function isSourceScript(url: string): boolean {
    return url.includes('/modules/') && url.lastIndexOf('.js') === url.length - 3;
}

export function isLess(url: string): boolean {
    url = url.split('?')[0].replace(/\\/g, '/');
    return url.lastIndexOf('.less') === url.length - 5 && (
        url.includes('modules/') || url.includes('/themeConfig/')
    );
}

export function isApiMock(url: string): boolean {
    return url.indexOf('/api/') === 0;
}

export function isTemplate(url: string): boolean {
    return url.includes('/modules/') && url.indexOf('.html') === url.length - 5;
}

export function isPage(url: string): boolean {
    const staticPathPartial = [
        'vendors',
        'api',
        'src',
        'img',
        'css',
        'fonts',
        'js',
        'bower_components',
        'node_modules',
        'ts-scripts',
        'modules',
        'themeConfig',
        'locales',
        'loginDaemon',
        'transfer.js',
        'tradingview-style',
        'data-service-dist',
        'locale',
        'init.js'
    ];
    return !staticPathPartial.some((path) => {
        return url.includes(`/${ path }`);
    });
}

function routeStatic(req, res, connectionType: TConnection, buildType: TBuild, platform: TPlatform) {
    const ROOTS = [join(__dirname, '..')];
    if (buildType !== 'dev') {
        ROOTS.push(join(__dirname, '..', 'dist', platform, connectionType, buildType));
    } else {
        ROOTS.push(join(__dirname, '..', 'src'));
    }

    const [url] = req.url.split('?');
    const contentType = getType(url);

    const check = (root: string) => {
        const path = join(root, url);
        readFile(path).then((file: Buffer) => {
            res.setHeader('Cache-Control', 'public, max-age=31557600');
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(file);
        })
            .catch(() => {
                if (ROOTS.length) {
                    check(ROOTS.pop());
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found\n');
                }
            });
    };

    check(ROOTS.pop());
}

export function getLocales(path: string, options?: object) {
    const postOptions = {
        method: 'POST',
        hostname: 'api.lokalise.co',
        path: '/api2/projects/389876335c7d2c119edf16.76978095/files/download',
        headers:
            {
                'x-api-token': '3ffba358636086e35054412e37db76d933cfe3b5',
                'content-type': 'application/json'
            }
    };

    const dataOptions = {
        format: 'json',
        original_filenames: true,
        directory_prefix: '/',
        export_empty_as: 'base',
        json_unescaped_slashes: true,
        replace_breaks: false,
        ...options
    };

    const zipName = `locale.zip`;
    const filePath = join(path, zipName);

    const loadAndExtract = () => {
        return new Promise((resolve, reject) => {
            const req = request(postOptions, response => {
                response.on('data', (data: string) => {
                    const file = createWriteStream(filePath);
                    const url = JSON.parse(data).bundle_url;

                    get(url, (response) => {
                        response.pipe(file);
                        response.on('end', () => {
                            extract(filePath, { dir: `${ path }/` }, error => {
                                if (error) {
                                    reject(error);
                                }
                                resolve();
                            });
                        });
                    });

                });
            });

            req.on('error', error => {
                reject(error);
            });

            req.write(JSON.stringify(dataOptions));

            req.end();
        });
    };

    return loadAndExtract()
        .then(() => {
            unlink(filePath, error => {
                if (error) {
                    console.log('ERROR', error);
                }
            });
        })
        .catch(err => console.error(`Locales did not loaded: ${ err }`));
}

export interface IRouteOptions {
    connectionType: string;
    buildType: string;
}

export interface IPrepareHTMLOptions {
    buildType?: TBuild;
    connection: TConnection;
    scripts?: string[];
    styles?: Array<{ name: string, theme: string, hasGet?: boolean }>;
    target: string;
    type: TPlatform;
    themes?: Array<string>;
    outerScripts?: Array<string>;
}

export interface IFilter {
    (name: string, path: string): boolean;
}
