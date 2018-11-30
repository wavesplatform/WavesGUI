import { remote } from 'electron';
import { join } from 'path';
import { exist, localeReady, readJSON, writeJSON } from './utils';


export class Storage {

    private storagePath: string = join(remote.app.getPath('userData'), 'storage.json');
    private backupPath: string = join(remote.app.getPath('userData'), 'backup.json');
    private storageCache: object;
    private ready: Promise<void>;


    constructor() {
        this.ready = this.initializeStorageCache();
    }

    public readStorage(key: string): any {
        return this.ready.then(() => this.storageCache[key]);
    }

    public writeStorage(key: string, value: any): Promise<void> {
        this.storageCache[key] = value;
        return writeJSON(this.storagePath, this.storageCache);
    }

    public clearStorage(): Promise<void> {
        this.storageCache = Object.create(null);
        return writeJSON(this.storagePath, this.storageCache);
    }

    private createNotification() {
        localeReady.then(t => {
            new Notification(t('storage.read.error.title'), {
                body: t('storage.read.error.body')
            });
        });
    }

    private initializeStorageCache(): Promise<void> {
        this.storageCache = Object.create(null);

        const applyBackup = () => {
            this.createNotification();
            return readJSON(this.backupPath).then(cache => {
                Object.assign(this.storageCache, cache);
            }).catch(() => {
                this.storageCache = Object.create(null);
            });
        };

        return exist(this.storagePath)
            .then(() => {
                return readJSON(this.storagePath)
                    .then(cache => {
                        Object.assign(this.storageCache, cache);
                        return writeJSON(this.backupPath, cache);
                    })
                    .catch(applyBackup);
            })
            .catch(() => exist(this.backupPath).then(applyBackup))
            .catch(() => writeJSON(this.storagePath, this.storageCache));
    }

}
