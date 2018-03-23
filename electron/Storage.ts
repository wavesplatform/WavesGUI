import { remote } from 'electron';
import { join } from 'path';
import { readJSON, writeJSON } from './utils';


export class Storage {

    private storagePath: string = join(remote.app.getPath('userData'), 'storage.json');
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

    private initializeStorageCache(): Promise<void> {
        this.storageCache = Object.create(null);
        return readJSON(this.storagePath).then((cache) => {
            Object.assign(this.storageCache, cache);
        }).catch(() => {
            return writeJSON(this.storagePath, this.storageCache);
        });
    }
}
