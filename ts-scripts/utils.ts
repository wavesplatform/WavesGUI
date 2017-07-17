import {exec, spawn} from 'child_process';
import {readdirSync, statSync} from 'fs';
import {join} from 'path';


export function getBranch(): Promise<string> {
    return new Promise((resolve, reject) => {
        const command = 'git symbolic-ref --short HEAD';
        exec(command, {encoding: 'utf8'}, (error: Error, stdout: string, stderr: string) => {
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
        return {branch, project: project.toUpperCase(), ticket: Number(ticket), description};
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

export function run(command: string, args: Array<string>): Promise<number> {
    return new Promise((resolve) => {
        const task = spawn(command, args);

        task.stdout.on('data', (data: Buffer) => {
            console.log(String(data));
        });

        task.stderr.on('data', (data: Buffer) => {
            console.log(String(data));
        });

        task.on('close', (code: number) => {
            resolve(code);
        });
    });
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

export interface IFilter {
    (name: string, path: string): boolean;
}
