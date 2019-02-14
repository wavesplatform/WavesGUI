(function () {
    'use strict';

    /**
     * @param {$q} $q
     * @param {app.utils} utils
     * @param {Migration} migration
     * @param {State} state
     * @param {storageSelect} storageSelect
     */
    const factory = function ($q, utils, migration, state, storageSelect) {

        const usedStorage = storageSelect();

        usedStorage.init();

        class Storage {

            constructor() {
                this._isNewDefer = Promise.resolve();
            }

            onReady() {
                return this._isNewDefer.promise;
            }

            save(key, value) {
                return utils.when(usedStorage.write(key, value));
            }

            load(key) {
                return utils.when(usedStorage.read(key));
            }

            clear() {
                return utils.when(usedStorage.clear());
            }

            setUser(user) {
                usedStorage.setUser(user);
            }

        }

        return new Storage();
    };

    factory.$inject = ['$q', 'utils', 'migration', 'state', 'storageSelect'];

    angular.module('app.utils')
        .factory('storage', factory);
})();
