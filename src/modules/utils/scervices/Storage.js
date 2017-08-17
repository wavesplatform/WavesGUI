(function () {
    'use strict';

    const factory = function ($q) {

        class Storage {

            save(key, value) {
                try {
                    return $q.when(localStorage.setItem(key, Storage.stringify(value)));
                } catch (e) {
                    return $q.reject(e.message);
                }
            }

            load(key) {
                const data = localStorage.getItem(key);
                return $q.when(Storage.parse(data));
            }

            clear() {
                localStorage.clear();
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

    factory.$inject = ['$q'];

    angular.module('app.utils').factory('Storage', factory);
})();
