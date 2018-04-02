import * as gulp from 'gulp';
import { getType } from 'mime';
import { exec, spawn } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join, relative, extname, dirname } from 'path';
import { IPackageJSON, IMetaJSON, ITaskFunction, TBuild, TConnection, TPlatform } from './interface';
import { readFile, readJSON, readJSONSync, createWriteStream, mkdirpSync, copy } from 'fs-extra';
import { compile } from 'handlebars';
import { transform } from 'babel-core';
import { render } from 'less';
import { minify } from 'html-minifier';
import { get } from 'https';


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
    return file.replace('<!-- JAVASCRIPT -->', paths.map((path) => {
        return `<script src="${path}"></script>`;
    }).join('\n'));
}

export function replaceStyles(file: string, paths: Array<string>): string {
    return file.replace('<!-- CSS -->', paths.map((path: string) => {
        return `<link rel="stylesheet" href="${path}">`;
    }).join('\n'));
}

export function isTradingView(url: string): boolean {
    return url.indexOf('/trading-view') !== -1;
}

export function prepareHTML(param: IPrepareHTMLOptions): Promise<string> {
    const filter = moveTo(param.target);

    return Promise.all([
        readFile(join(__dirname, '../src/index.html'), 'utf8') as Promise<string>,
        readJSON(join(__dirname, '../package.json')) as Promise<IPackageJSON>,
        readJSON(join(__dirname, './meta.json')) as Promise<IMetaJSON>
    ])
        .then(([file, pack, meta]) => {
            const connectionTypes = ['mainnet', 'testnet'];

            if (!param.scripts) {
                const sourceFiles = getFilesFrom(join(__dirname, '../src'), '.js', function (name, path) {
                    return !name.includes('.spec') && !path.includes('/test/');
                });
                const cacheKiller = `?v${pack.version}`;
                param.scripts = meta.vendors.map((i) => join(__dirname, '..', i)).concat(sourceFiles);
                meta.debugInjections.forEach((path) => {
                    param.scripts.unshift(join(__dirname, '../', path));
                });
                param.scripts = param.scripts.map((path) => `${path}${cacheKiller}`);
            }

            if (!param.styles) {
                param.styles = meta.stylesheets.map((i) => join(__dirname, '..', i)).concat(getFilesFrom(join(__dirname, '../src'), '.less'));
            }

            const networks = connectionTypes.reduce((result, item) => {
                result[item] = meta.configurations[item];
                return result;
            }, Object.create(null));

            return compile(file)({
                pack: pack,
                isWeb: param.type === 'web',
                isProduction: param.buildType && param.buildType === 'min',
                domain: meta.domain,
                build: {
                    type: param.type
                },
                network: networks[param.connection]
            });
        })
        .then((file) => {
            return replaceStyles(file, param.styles.map(filter).map(s => `/${s}`));
        }).then((file) => {
            return replaceScripts(file, param.scripts.map(filter));
        });
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

export function route(connectionType: TConnection, buildType: TBuild, type: TPlatform) {
    return function (req, res) {
        const url = req.url.replace(/\?.*/, '');

        if (isTradingView(url)) {
            get(`https://beta.wavesplatform.com/${url}`, (resp) => {
                let data = '';

                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
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
                type
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
            readFile(join(__dirname, '../src', url), 'utf8')
                .then((style) => {
                    (render as any)(style, {
                        filename: join(__dirname, '../src', url)
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
                            'transform-object-rest-spread'
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
        routes[`/${moveTo(join(__dirname, '..'))(path).replace('.js', '.json')}`] = require(path);
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
    return url.includes('/modules/') && url.lastIndexOf('.less') === url.length - 5;
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
        'locales',
        'loginDaemon',
        'transfer.js'
    ];
    return !staticPathPartial.some((path) => {
        return url.includes(`/${path}`);
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

export interface IRouteOptions {
    connectionType: string;
    buildType: string;
}

export interface IPrepareHTMLOptions {
    buildType?: TBuild;
    connection: TConnection;
    scripts?: string[];
    styles?: string[];
    target: string;
    type: TPlatform;
}

export interface IFilter {
    (name: string, path: string): boolean;
}
