import { remote } from 'electron';
import { join, basename } from 'path';
import { exist, localeReady, readJSON, writeJSON, readdir, unlink, read, rename } from './utils';


export class Storage {

    private storageCache: object;
    private activeWrite: Promise<void> = Promise.resolve();
    private readonly storagePath: string = join(remote.app.getPath('userData'), 'storage.json');
    private readonly ready: Promise<void>;
    private static readonly backupCount: number = 100;


    constructor() {
        this.ready = this.initializeStorageCache();
    }

    public readStorage(key: string): any {
        return this.ready.then(() => this.storageCache[key]);
    }

    public writeStorage(key: string, value: any): Promise<void> {
        return this.ready.then(() => {
            if (this.storagePath[key] === value) {
                return void 0;
            }
            this.storageCache[key] = value;
            this.activeWrite = this.activeWrite
                .then(() => writeJSON(this.storagePath, this.storageCache));

            return this.activeWrite;
        });
    }

    public clearStorage(): Promise<void> {
        this.storageCache = Object.create(null);
        return writeJSON(this.storagePath, this.storageCache);
    }

    private createNotification(title, body) {
        localeReady.then(t => {
            new Notification(t(title), {
                body: t(body)
            });
        });
    }

    private initializeStorageCache(): Promise<void> {
        this.storageCache = Object.create(null);

        return exist(this.storagePath)
            .then(exist => {
                if (exist) {
                    return readJSON(this.storagePath)
                        .then(cache => {
                            Object.assign(this.storageCache, cache);
                            return Storage.createBackup(cache);
                        })
                        .catch(() => this.restoreFromBackup());
                } else {
                    return Storage.getBackupFileNames().then(list => list.length ? this.restoreFromBackup() : void 0);
                }
            })
            .catch(() => this.restoreFromBackup());
    }

    private restoreFromBackup(): Promise<void> {
        return Storage.markAsBroken(this.storagePath)
            .catch(() => void 0)
            .then(Storage.getBackupFileNames)
            .then(names => {
                const loop = (index) => {
                    if (!names[index]) {
                        return Promise.reject('Has no available backup file!');
                    }
                    const path = join(remote.app.getPath('userData'), names[index]);
                    return readJSON(path)
                        .catch(
                            () => Storage.markAsBroken(path)
                                .then(() => loop(index + 1))
                        );
                };

                return loop(0);
            })
            .then(cache => {
                this.createNotification('storage.read.error.title', 'storage.read.error.body');
                Object.assign(this.storageCache, cache);
            })
            .catch(() => {
                this.createNotification('storage.backup.error.title', 'storage.backup.error.body');
            });
    }

    private static markAsBroken(path: string): Promise<void> {
        const fileName = basename(path, '.json');
        return rename(path, path.replace(`${fileName}.json`, `${fileName}_broken_${Date.now()}.json`));
    }

    private static createBackup(data: object): Promise<void> {
        return Storage.getBackupFileNames().then(names => {
            return names.length ? read(join(remote.app.getPath('userData'), Storage.head(names))) : Promise.resolve('');
        }).then(content => {
            if (content === JSON.stringify(data)) {
                return undefined;
            }
            const name = `backup_${Date.now()}.json`;

            return writeJSON(join(remote.app.getPath('userData'), name), data)
                .then(Storage.getBackupFileNames)
                .then(list => {
                    if (list.length >= Storage.backupCount) {
                        Storage.removeOldBackup(list);
                    }
                });
        });
    }

    private static getBackupFileNames(): Promise<Array<string>> {
        return readdir(remote.app.getPath('userData'))
            .then(list => list.filter(name => /backup(_\d+)?\.json/.test(name)))
            .then(list => list.map(name => Number(Storage.head(name.match(/\d+/g) || []) || 0)))
            .then(list => list.sort((a, b) => b - a))
            .then(list => list.map(date => date ? `backup_${date}.json` : 'backup.json'));
    }

    private static removeOldBackup(list: Array<string>): void {
        list.slice(Storage.backupCount + 1).forEach(name => {
            unlink(join(remote.app.getPath('userData'), name));
        });
    }

    private static head<T>(array: Array<T>): T | undefined {
        return array[0];
    }
}
