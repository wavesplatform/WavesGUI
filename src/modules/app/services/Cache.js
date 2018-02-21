(function () {
    'use strict';

    const factory = function () {

        class Cache {

            constructor() {
                this._props = Object.create(null);
            }

            set(id, data) {
                this._props[id] = data;
            }

            update(id, data) {
                const item = this.get(id);
                if (item) {
                    Object.assign(item, data);
                } else {
                    this.set(id, data);
                }
            }

            get(id) {
                return this._props[id];
            }

        }

        return Cache;
    };

    factory.$inject = [];

    angular.module('app').factory('Cache', factory);
})();
