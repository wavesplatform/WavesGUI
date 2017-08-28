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
        const cachePath = '';
        const wrap = function (method, args) {
            return new Promise((resolve, reject) => {
                fs[method](...args, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                })
            });
        };
        const getCache = function () {
            return wrap('readFile', cachePath, 'utf8').then((text) => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return Promise.reject(e);
                }
            });
        };
        read = function (key) {
            return getCache().then((data) => {
                return data[key] || null;
            }).catch(() => {
                return {};
            });
        };
        write = function (key, value) {
            return getCache().then((data) => {
                data[key] = value;
                return wrap('writeFile', cachePath, JSON.stringify(data));
            });
        };
        clear = function () {
            return wrap('writeFile', cachePath, '{}');
        };
    }

    const factory = function ($q, utils, storageMigration) {

        class Storage {

            constructor() {
                this.load('lastVersion').then((version) => {
                    this.save('lastVersion', WavesApp.version);
                    storageMigration.migrateTo(version, this);
                });
            }

            save(key, value) {
                return utils.when(write(key, Storage.stringify(value)));
            }

            load(key) {
                return utils.when(read(key));
            }

            clear() {
                return utils.when(clear());
            }

            static stringify(data) {
                switch (typeof data) {
                    case 'string':
                        return data;
                    case 'object':
                        return JSON.stringify(data);
                    default:
                        return String(data);
                }
            }

            static parse(some) {
                try {
                    return JSON.parse(some);
                } catch (e) {
                    return some;
                }
            }

        }

        return new Storage();
    };

    factory.$inject = ['$q', 'utils', 'storageMigration'];

    angular.module('app.utils').factory('storage', factory);
})();
