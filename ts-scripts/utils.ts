import { exec } from 'child_process';
import { readFile as readFileFs } from 'fs';

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

export function getBranchDetail(): Promise<{branch: string; project: string; ticket: number; description: string}> {
    return getBranch().then((branch) => {
        const parts = branch.split('-');
        const [project, ticket] = parts;
        const description = parts.slice(2).join(' ');
        return { branch, project: project.toUpperCase(), ticket: Number(ticket), description };
    });
}

export function readFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        readFileFs(path, 'utf8', (err, file) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(file);
            }
        });
    });
}
