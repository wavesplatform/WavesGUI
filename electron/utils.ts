import { readFile, writeFile as fsWriteFile, existsSync } from 'fs';


export function exist(path: string): Promise<void> {
    const exists = existsSync(path);
    if (exists) {
        return Promise.resolve();
    } else {
        return Promise.reject(new Error(`File with path ${path} does not exist!`));
    }
}

export function read(path: string): Promise<string> {
    return exist(path).then(() => {
        return new Promise<string>((resolve, reject) => {
            readFile(path, 'utf8', (error, file) => {
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
        fsWriteFile(path, content, function (error) {
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
