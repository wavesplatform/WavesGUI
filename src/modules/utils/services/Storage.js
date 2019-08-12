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

        const MIGRATION_MAP = {
            '1.0.41': function (storage) {
                return addNewGateway(storage, WavesApp.defaultAssets.BSV);
            },
            '1.2.1': function (storage) {
                return newTerms(storage);
            },
            '1.3.18': function (storage) {
                return addDefaultUserName(storage);
            }
        };

        function newTerms(storage) {
            return storage.load('userList').then((users = []) => {
                const needShowNewTerms = users.some((user) => {
                    const settings = user.settings || Object.create(null);
                    return typeof settings.termsAccepted === 'undefined';
                });
                if (needShowNewTerms) {
                    return storage.save('needReadNewTerms', true);
                }
            });
        }

        function addNewGateway(storage, gateway) {
            return storage.load('userList').then((users = []) => {
                users.forEach((user) => {
                    const settings = user.settings || Object.create(null);
                    const idList = settings.pinnedAssetIdList;
                    if (idList && !idList.includes(gateway)) {
                        idList.push(gateway);
                    }
                });

                return storage.save('userList', users);
            });
        }

        function addDefaultUserName(storage) {
            return storage.load('userList').then((users = []) => {
                let counter = 0;
                users.forEach((user) => {
                    if (!user.name) {
                        user.name = ++counter >= 2 ? `Account ${counter}` : 'Account';
                    }
                });

                return storage.save('userList', users);
            });
        }

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
