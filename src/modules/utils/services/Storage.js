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

        const MIGRATION_MAP = {};

        // function addNewGateway(storage, gateway) {
        //     return storage.load('userList').then((users = []) => {
        //         users.forEach((user) => {
        //             const settings = user.settings || Object.create(null);
        //             const idList = settings.pinnedAssetIdList;
        //             if (idList && !idList.includes(gateway)) {
        //                 idList.push(gateway);
        //             }
        //         });
        //
        //         return storage.save('userList', users);
        //     });
        // }

        class Storage {

            constructor() {
                usedStorage.init();
                this._isNewDefer = $q.defer();

                this.load('lastVersion')
                    .then((version) => {
                        this.save('lastVersion', WavesApp.version);
                        state.lastOpenVersion = version;

                        if (version) {
                            const versions = migration.migrateFrom(version, Object.keys(MIGRATION_MAP));
                            return utils.chainCall(versions.map((version) => MIGRATION_MAP[version].bind(null, this)))
                                .then(() => {
                                    this._isNewDefer.resolve(version);
                                });
                        } else {
                            this._isNewDefer.resolve(version);
                            return Promise.resolve();
                        }
                    });
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

        }

        return new Storage();
    };

    factory.$inject = ['$q', 'utils', 'migration', 'state', 'storageSelect'];

    angular.module('app.utils')
        .factory('storage', factory);
})();
