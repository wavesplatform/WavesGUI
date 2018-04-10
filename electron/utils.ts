import * as fs from 'fs';
import { remote } from 'electron';

export function exist(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.exists(path, function (exists) {
            exists ? resolve() : reject(new Error(`File with path ${path} does not exist!`));
        });
    });
}

export function read(path: string): Promise<string> {
    return exist(path).then(() => {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(path, 'utf8', (error, file) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(file);
                }
            });
        });
    });
}

export function readJSON(path: string): Promise<object> {
    return read(path).then((file) => JSON.parse(file));
}

export function writeFile(path: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, content, function (error) {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export function writeJSON(path: string, content: object | Array<object>): Promise<void> {
    return writeFile(path, JSON.stringify(content));
}
