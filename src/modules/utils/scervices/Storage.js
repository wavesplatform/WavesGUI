(function () {
    'use strict';

    let read;
    let write;
    let clear;

    if (WavesApp.isWeb()) {
        read = function (key) {
            return Promise.resolve(localStorage.getItem(key));
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
        // TODO add fs API for electron
    }

    const factory = function ($q, utils) {

        class Storage {

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

    factory.$inject = ['$q', 'utils'];

    angular.module('app.utils').factory('Storage', factory);
})();
