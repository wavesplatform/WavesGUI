(function () {
    'use strict';

    /**
     * @param {$q} $q
     * @param {app.utils} utils
     * @param {Migration} migration
     * @param {State} state
     * @param {storageSelect} storageSelect
     * @param {DefaultSettings} defaultSettings
     * @param {StorageDataConverter} storageDataConverter
     * @param {$injector} $injector
     */
    const factory = function ($q, utils, migration, state, storageSelect, defaultSettings, storageDataConverter,
                              $injector) {

        const usedStorage = storageSelect();

        const MIGRATION_MAP = {
            '1.0.41': function (storage) {
                return addNewGateway(storage, WavesApp.defaultAssets.BSV);
            },
            '1.2.1': function (storage) {
                return newTerms(storage);
            },
            '1.3.19': function (storage) {
                return saveUsersWithUniqueName(storage)
                    .then(data => addNewGateway(data, WavesApp.defaultAssets.BNT));
            },
            '1.4.0': storage => migrateCommonSettings(storage)
        };

        function newTerms(storage) {
            return storage.load('userList').then(users => {
                const needShowNewTerms = (users || []).some((user) => {
                    const settings = user.settings || Object.create(null);
                    return typeof settings.termsAccepted === 'undefined';
                });
                if (needShowNewTerms) {
                    return storage.save('needReadNewTerms', true);
                }
            });
        }

        function addNewGateway(storage, gateway) {
            return storage.load('userList').then(users => {
                (users || []).forEach(user => {
                    const settings = user.settings || Object.create(null);
                    const idList = settings.pinnedAssetIdList;
                    if (idList && !idList.includes(gateway)) {
                        idList.push(gateway);
                    }
                });

                return storage.save('userList', users || []);
            });
        }

        function saveUsersWithUniqueName(storage) {
            return storage.load('userList').then(usersInStorage => {

                const getUniqueName = (arr, userName) => {
                    let counter = 1;
                    const getNum = (name) => {
                        if (arr.some(user => user.name === name)) {
                            return getNum(`${userName} ${++counter}`);
                        } else {
                            return counter;
                        }
                    };
                    const num = getNum(userName);
                    return num > 1 ? `${userName} ${num}` : userName;
                };

                const users = (usersInStorage || []).reduce((acc, user) => {
                    const otherUsers = acc.filter(item => item !== user);

                    if (!user.name) {
                        user.name = 'Account';
                    }

                    return ([
                        ...otherUsers,
                        {
                            ...user,
                            name: getUniqueName(otherUsers, user.name)
                        }
                    ]);

                }, (usersInStorage || []));

                return storage.save('userList', users).then(() => storage);
            });
        }

        function migrateCommonSettings(storage) {
            return storage.load('userList').then(userList => {
                const commonSettings = defaultSettings.create();

                (userList || []).sort((a, b) => a.lastLogin - b.lastLogin).forEach(curUser => {
                    if (curUser.settings) {
                        try {
                            const userSettings = defaultSettings.create();
                            const flatSettings = JSON.parse(storageDataConverter.stringify(curUser.settings));

                            Object.entries(flatSettings).forEach(([path, value]) => {
                                commonSettings.set(path, value);
                                userSettings.set(path, value);
                            });

                            curUser.settings = userSettings.getSettings().settings;
                        } catch (e) {
                            delete curUser.settings;
                        }
                    }
                });

                return Promise.all([
                    storage.save('multiAccountSettings', commonSettings.getSettings().common),
                    storage.save('userList', userList)
                ]);
            });
        }

        class Storage {

            constructor() {
                usedStorage.init();
                this._isNewDefer = $q.defer();
                this._canWrite = $q.defer();
                this._activeWrite = Promise.resolve();
                const version = navigator.userAgent.replace(/.*?waves-(client|dex)\/(\d+\.\d+\.\d+).*/g, '$2');

                if (version && migration.lte(version, '1.2.1')) {
                    setTimeout(() => {
                        $injector.get('notification').error({
                            title: { literal: 'Need update client from official site!' }
                        }, -1);
                    }, 2000);
                    this._activeWrite = $q.defer();
                    return this;
                }

                this.load('lastVersion')
                    .then((version) => {
                        this._canWrite.resolve();
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
                return this._canWrite.promise.then(() => {
                    this._activeWrite = this._activeWrite.then(() => utils.when(usedStorage.write(key, value)));
                    return this._activeWrite;
                });
            }

            load(key) {
                return utils.when(usedStorage.read(key));
            }

            clear() {
                return this._canWrite.promise.then(() => utils.when(usedStorage.clear()));
            }

        }

        return new Storage();
    };

    factory.$inject = [
        '$q', 'utils', 'migration',
        'state', 'storageSelect', 'defaultSettings',
        'storageDataConverter', '$injector'
    ];

    angular.module('app.utils')
        .factory('storage', factory);
})();
