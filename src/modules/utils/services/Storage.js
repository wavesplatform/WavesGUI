(function () {
    'use strict';

    let read;
    let write;
    let clear;

    if (WavesApp.isWeb()) {
        read = function (key) {
            const data = localStorage.getItem(key);
            try {
                return Promise.resolve(JSON.parse(data));
            } catch (e) {
                return Promise.resolve(data);
            }
        };
        write = function (key, value) {
            localStorage.setItem(key, value);
            return Promise.resolve();
        };
        clear = function () {
            localStorage.clear();
            return Promise.resolve();
        };
    } else {
        const fs = require('fs');
        const path = require('path');
        const remote = require('electron').remote;
        const cachePath = path.join(remote.app.getPath('userData'), './storage.json');

        const wrap = function (method, ...args) {
            return new Promise((resolve, reject) => {
                args.push(function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
                fs[method](...args);
            });
        };

        if (!fs.existsSync(cachePath)) {
            fs.writeFileSync(cachePath, '{}');
        }

        const getCache = function () {
            return wrap('readFile', cachePath, 'utf8')
                .then((text) => {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        return Promise.reject(e);
                    }
                });
        };
        read = function (key) {
            return getCache()
                .then((data) => {
                    try {
                        return JSON.parse(data[key] || '');
                    } catch (e) {
                        return {};
                    }
                })
                .catch(() => {
                    return {};
                });
        };
        write = function (key, value) {
            return getCache()
                .then((data) => {
                    data[key] = value;
                    return wrap('writeFile', cachePath, JSON.stringify(data));
                });
        };
        clear = function () {
            return wrap('writeFile', cachePath, '{}');
        };
    }

    /**
     * @param {$q} $q
     * @param {app.utils} utils
     * @param {StorageMigration} storageMigration
     */
    const factory = function ($q, utils, storageMigration) {

        class Storage {

            constructor() {
                this._isNewDefer = $q.defer();

                this.load('lastVersion')
                    .then((version) => {
                        this._isNewDefer.resolve(!version);
                        this.save('lastVersion', WavesApp.version);
                        storageMigration.migrateTo(version, this);
                    });
            }

            onReady() {
                return this._isNewDefer.promise;
            }

            save(key, value) {
                return utils.when(write(key, Storage.stringify(value)));
            }

            load(key) {
                return utils.when(read(key))
                    .then(data => Storage.myParse(data));
            }

            clear() {
                return utils.when(clear());
            }

            static stringify(data) {
                switch (typeof data) {
                    case 'string':
                        return data;
                    case 'object':
                        try {
                            return Storage.myStringify(data);
                        } catch (e) {
                            return String(data);
                        }
                    default:
                        return String(data);
                }
            }

            static myStringify(data) {
                try {
                    const paths = tsUtils.getPaths(data);
                    return JSON.stringify(paths.reduce((result, item) => {
                        result[String(item)] = tsUtils.get(data, item);
                        return result;
                    }, Object.create(null)));
                } catch (e) {
                    return JSON.stringify(data);
                }
            }

            static myParse(data) {
                if (typeof data === 'object') {
                    let result;
                    tsUtils.each(data, (value, path) => {
                        if (!result) {
                            result = tsUtils.Path.parse(path)
                                .getItemData(0).container;
                        }
                        tsUtils.set(result, path, value);
                    });
                    return result;
                } else {
                    return data;
                }
            }

        }

        return new Storage();
    };

    factory.$inject = ['$q', 'utils', 'storageMigration'];

    angular.module('app.utils')
        .factory('storage', factory);
})();
