import { remote } from 'electron';
import { join } from 'path';
import { readJSON, writeJSON } from './utils';


export class Storage {

    private storagePath: string = join(remote.app.getPath('userData'), 'storage.json');
    private storageCache: object;


    constructor() {
        this.initializeStorageCache();
    }

    public readStorage(key: string): any {
        return this.storageCache[key];
    }

    public writeStorage(key: string, value: any): Promise<{}> {
        this.storageCache[key] = value;
        return writeJSON(this.storagePath, this.storageCache);
    }

    public clearStorage(): Promise<{}> {
        this.storageCache = Object.create(null);
        return writeJSON(this.storagePath, this.storageCache);
    }

    private initializeStorageCache(): void {
        this.storageCache = Object.create(null);
        readJSON(this.storagePath).then((cache) => {
            Object.assign(this.storageCache, cache);
        }).catch(() => {
            writeJSON(this.storagePath, this.storageCache);
        });
    }
}
