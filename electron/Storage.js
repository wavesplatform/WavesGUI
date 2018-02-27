"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const utils_1 = require("./utils");
class Storage {
    constructor() {
        this.storagePath = path_1.join(electron_1.remote.app.getPath('userData'), 'storage.json');
        this.initializeStorageCache();
    }
    readStorage(key) {
        return this.storageCache[key];
    }
    writeStorage(key, value) {
        this.storageCache[key] = value;
        return utils_1.writeJSON(this.storagePath, this.storageCache);
    }
    clearStorage() {
        this.storageCache = Object.create(null);
        return utils_1.writeJSON(this.storagePath, this.storageCache);
    }
    initializeStorageCache() {
        this.storageCache = Object.create(null);
        utils_1.readJSON(this.storagePath).then((cache) => {
            Object.assign(this.storageCache, cache);
        }).catch(() => {
            utils_1.writeJSON(this.storagePath, this.storageCache);
        });
    }
}
exports.Storage = Storage;
//# sourceMappingURL=Storage.js.map