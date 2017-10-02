import * as gulp from 'gulp';
import { getType } from 'mime';
import { exec, spawn } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { ITaskFunction } from './interface';
import { readFile, readJSON } from 'fs-extra';
import { compile } from 'handlebars';
import { transform } from 'babel-core';


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
                resolve(stdout);
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

export function getFilesFrom(dist: string, extension: string, filter?: IFilter): Array<string> {
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
                if (itemName.lastIndexOf(extension) === (itemName.length - extension.length)) {
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
    }
}

export function replaceScripts(file: string, paths: Array<string>): string {
    return file.replace('<!-- JAVASCRIPT -->', paths.map((path) => {
        return `<script src="${path}"></script>`;
    }).join('\n'));
}

export function replaceStyles(file: string, paths: Array<string>): string {
    return file.replace('<!-- CSS -->', paths.map((path: string) => {
        return `<link rel="stylesheet" href="${path}" />`;
    }).join('\n'));
}

export function prepareHTML(param: IPrepareHTMLOptions): Promise<string> {
    const filter = moveTo(param.target);

    return Promise.all([
        readFile(join(__dirname, '../src/index.html'), 'utf8'),
        readJSON(join(__dirname, '../package.json')),
        readJSON(join(__dirname, './meta.json'))
    ])
        .then((data) => {
            const [file, pack, meta] = data;
            const connectionTypes = ['mainnet', 'testnet'];

            if (!param.scripts) {
                const sourceFiles = getFilesFrom(join(__dirname, '../src'), '.js', function (name, path) {
                    return !name.includes('.spec') && !path.includes('/test/');
                });
                param.scripts = meta.vendors.map((i) => join(__dirname, '..', i)).concat(sourceFiles);
            }

            if (!param.styles) {
                param.styles = meta.stylesheets.map((i) => join(__dirname, '..', i)).concat(getFilesFrom(join(__dirname, '../src'), '.css'));
            }

            const networks = connectionTypes.reduce((result, item) => {
                result[item] = meta.configurations[item];
                return result;
            }, Object.create(null));

            return compile(file)({
                pack: pack,
                build: {
                    type: 'web'
                },
                network: networks[param.connection]
            })
        })
        .then((file) => {
            return replaceStyles(file, param.styles.map(filter).map(s => `/${s}`));
        }).then((file) => {
            return replaceScripts(file, param.scripts.map(filter));
        });
}

export function route(connectionType, buildType) {
    return function (req, res) {
        if (req.url === '/img/images-list.json') {
            res.setHeader('Content-Type', 'application/json');
            const images = getFilesFrom(join(__dirname, '../src/img'), '.svg').map(moveTo(join(__dirname, '../src')));
            res.end(JSON.stringify(images));
            return null;
        }

        if (isPage(req.url)) {
            if (buildType === 'dev') {
                return prepareHTML({
                    target: join(__dirname, '..', 'src'),
                    connection: connectionType
                }).then((file) => {
                    res.end(file);
                });
            } else {
                const path = join(__dirname, '../dist/build', connectionType, buildType, 'index.html');
                return readFile(path, 'utf8').then((file) => {
                    res.end(file);
                });
            }
        } else if (isSourceScript(req.url)) {
            readFile(join(__dirname, '../src', req.url), 'utf8')
                .then((code) => {
                    if (code.indexOf('@decorators') !== -1) {
                        const result = transform(code, {
                            plugins: [
                                'transform-decorators-legacy',
                                'transform-class-properties',
                                'transform-decorators',
                                'transform-object-rest-spread'
                            ]
                        }).code;
                        return result;
                    } else {
                        return code;
                    }
                })
                .then((code) => res.end(code))
                .catch((e) => {
                    console.log(e.message, req.url);
                });
        } else if (isApiMock(req.url)) {
            const mock = require(join(__dirname, '..', req.url.replace('.json', '')));
            res.setHeader('Content-Type', 'application/json');
            mock(req, res);
        } else {
            routeStatic(req, res);
        }
    }
}

export function isSourceScript(url: string): boolean {
    return url.includes('/modules/') && url.lastIndexOf('.js') === url.length - 3;
}

export function isApiMock(url: string): boolean {
    return url.indexOf('/api/') === 0;
}

export function isPage(url: string): boolean {
    const staticPathPartial = [
        'vendors', 'api', 'src', 'img', 'css', 'fonts', 'js', 'bower_components', 'node_modules', 'modules', 'locales'
    ];
    return !staticPathPartial.some((path) => {
        return url.includes(`/${path}/`);
    });
}

function routeStatic(req, res) {
    const ROOTS = [
        join(__dirname, '..'),
        join(__dirname, '../src')
    ];
    const contentType = getType(req.url);

    const check = (root: string) => {
        const path = join(root, req.url);
        readFile(path).then((file: Buffer) => {
            res.setHeader('Cache-Control', 'public, max-age=31557600');
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(file);
        })
            .catch(() => {
                if (ROOTS.length) {
                    check(ROOTS.pop());
                } else {
                    res.writeHead(404, null);
                    res.end('404 Not found!');
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
    connection: string;
    scripts?: string[];
    styles?: string[];
    target: string;
}

export interface IFilter {
    (name: string, path: string): boolean;
}
