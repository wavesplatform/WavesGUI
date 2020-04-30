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
     */
    const factory = function (
        $q,
        utils,
        migration,
        state,
        storageSelect,
        defaultSettings,
        storageDataConverter
    ) {

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
            '1.4.0': storage => migrateCommonSettings(storage),
            '1.4.6': storage => fixMigrateCommonSettings(storage),
            '1.4.16': storage => fixUndefined(storage)
        };

        const { Signal, isObject } = require('ts-utils');

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

        function fixSettings(user) {
            const newDefaultSettings = defaultSettings.create();
            const pinnedList = newDefaultSettings.get('pinnedAssetIdList');

            if (!user || typeof user.settings !== 'object') {
                return {};
            }

            const settings = { ...user.settings };

            if (settings.pinnedAssetIdList && settings.pinnedAssetIdList.length) {
                const list = [...settings.pinnedAssetIdList];

                for (let assetIndex = list.length; assetIndex--;) {
                    if (list[assetIndex] == null) {
                        list[assetIndex] = pinnedList[assetIndex];
                    }
                }

                settings.pinnedAssetIdList = list;
            }

            if (settings.dex && settings.dex.watchlist && settings.dex.watchlist.favourite) {
                const dexSettings = { ...settings.dex };
                dexSettings.watchlist = { ...dexSettings.watchlist };

                if (!Array.isArray(dexSettings.watchlist.favourite)) {
                    dexSettings.watchlist.favourite = [];
                }

                const favourite = dexSettings.watchlist.favourite
                    .map(pair => {
                        if (!pair || pair.length === 0) {
                            return null;
                        }

                        if (!pair[0] || !pair[1]) {
                            return null;
                        }

                        return pair;
                    })
                    .filter(Boolean);

                dexSettings.watchlist.favourite = favourite;
                settings.dex = dexSettings;
            }

            return settings;
        }

        function fixMigrateCommonSettings(storage) {
            return Promise.all([
                storage.load('userList'),
                storage.load('multiAccountUsers')
            ]).then(([userList, multiAccountUsers]) => {
                try {
                    if (userList && userList.length) {
                        userList = userList.map(user => ({ ...user, settings: fixSettings(user) }));
                    }

                    if (multiAccountUsers && typeof multiAccountUsers === 'object') {
                        const users = Object.entries(multiAccountUsers);
                        multiAccountUsers = users.reduce((acc, [key, user]) => {
                            user = { ...user, settings: fixSettings(user) };
                            acc[key] = user;
                            return acc;
                        }, Object.create(null));
                    }
                } catch (e) {
                    return null;
                }

                return Promise.all([
                    multiAccountUsers ? storage.save('multiAccountUsers', multiAccountUsers) : Promise.resolve(),
                    userList ? storage.save('userList', userList) : Promise.resolve()
                ]);

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

        function fixUndefined(storage) {
            return Promise.all([
                storage.load('userList'),
                storage.load('multiAccountUsers')
            ]).then(([userList, multiAccountUsers]) => {
                const deleteUndefinedFromObject = (obj) => Array.from('undefined').forEach((_x, i) => {
                    delete obj[i];
                });

                const deleteUndefinedFromArray = (arr) => {
                    const tmp = Object.create(null);

                    for (const k in arr) {
                        if (isNaN(k)) {
                            tmp[k] = arr[k];
                        }
                    }

                    return tmp;
                };

                if (isObject(userList)) {
                    deleteUndefinedFromObject(userList);
                }

                if (isObject(multiAccountUsers)) {
                    deleteUndefinedFromObject(multiAccountUsers);
                } else if (Array.isArray(multiAccountUsers)) {
                    multiAccountUsers = deleteUndefinedFromArray(multiAccountUsers);
                }

                return Promise.all([
                    userList ?
                        storage.save('userList', userList === 'undefined' ? '' : userList) :
                        Promise.resolve(),
                    multiAccountUsers ?
                        storage.save('multiAccountUsers', multiAccountUsers === 'undefined' ? '' : multiAccountUsers) :
                        Promise.resolve()
                ]);
            });
        }

        class Storage {

            /**
             * @type {Signal<string>}
             */
            change = new Signal();

            constructor() {
                usedStorage.init();
                this._memStore = {};
                this._isNewDefer = $q.defer();
                this._canWrite = $q.defer();
                this._activeWrite = Promise.resolve();

                this.load('lastVersion')
                    .then((version) => {
                        this._canWrite.resolve();
                        state.lastOpenVersion = version;

                        if (version) {
                            const versions = migration.migrateFrom(version, Object.keys(MIGRATION_MAP));
                            return utils.chainCall(versions.map((version) => MIGRATION_MAP[version].bind(null, this)))
                                .then(() => {
                                    this._isNewDefer.resolve(version);
                                    this.save('lastVersion', WavesApp.version);
                                });
                        } else {
                            this._isNewDefer.resolve(version);
                            this.save('lastVersion', WavesApp.version);
                            return Promise.resolve();
                        }
                    });
            }

            onReady() {
                return this._isNewDefer.promise;
            }

            save(key, value) {
                return this._canWrite.promise.then(() => {
                    this._activeWrite = this._activeWrite
                        .then(() => {
                            this._memStore[key] = value;
                            return value;
                        })
                        .then((data) => {
                            this.change.dispatch();
                            return data;
                        });
                    return this._activeWrite;
                });
            }

            load(key) {
                return utils.when((() => {
                    if (this._memStore[key]) {
                        return Promise.resolve(this._memStore[key]);
                    }
                    return usedStorage.read(key);
                })());
            }

            clear() {
                return this._canWrite.promise.then(() => utils.when(() => {
                    this._memStore = {};
                }));
            }

        }

        return new Storage();
    };

    factory.$inject = [
        '$q', 'utils', 'migration',
        'state', 'storageSelect', 'defaultSettings',
        'storageDataConverter'
    ];

    angular.module('app.utils')
        .factory('storage', factory);
})();
