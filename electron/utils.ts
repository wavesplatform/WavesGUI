import * as fs from 'fs';

export function exist(path) {
    return new Promise((resolve, reject) => {
        fs.exists(path, function (exists) {
            exists ? resolve() : reject(new Error(`File with path ${path} does not exist!`));
        });
    });
}

export function read(path): Promise<string> {
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

export function readJSON(path) {
    return read(path).then((file) => JSON.parse(file));
}

export function writeFile(path, content) {
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

export function writeJSON(path, content): Promise<{}> {
    return writeFile(path, JSON.stringify(content));
}
