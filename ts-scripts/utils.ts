import * as gulp from 'gulp';
import { exec, spawn } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { ITaskFunction } from './interface';
import { readFile, readJSON } from 'fs-extra';
import { compile } from 'handlebars';


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
                param.scripts = meta.vendors.concat(sourceFiles);
            }

            if (!param.styles) {
                param.styles = [`${param.target}/css/${pack.name}-styles-${pack.version}.css`];
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
            return replaceStyles(file, param.styles.map(filter));
        }).then((file) => {
            return replaceScripts(file, param.scripts.map(filter));
        });
}

export function route(options: IRouteOptions): Promise<string> {
    if (options.buildType === 'dev') {
        return prepareHTML({
            target: join(__dirname, '..', 'dist', 'build', options.connectionType, options.buildType),
            connection: options.connectionType
        });
    } else {
        return readFile(join(__dirname, '../dist/build', options.connectionType, options.buildType, 'index.html'), 'utf8');
    }
}

export function isPage(url: string): boolean {
    const staticPathPartial = [
        'src', 'img', 'css', 'fonts', 'js', 'bower_components', 'node_modules', 'modules', 'locales'
    ];
    return !staticPathPartial.some((path) => {
        return url.includes(`/${path}/`);
    });
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
