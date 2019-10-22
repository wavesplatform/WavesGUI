// @ts-check

(function () {
    'use strict';

    const { libs } = require('@waves/waves-transactions');
    const { decryptSeed } = libs.crypto;

    class StorageImporter {

        static $inject = [
            '$log',
            '$state',
            'storage',
            'user',
            'multiAccount'
        ];

        /**
         * @param {ng.ILogService} $log
         * @param {*} $state
         * @param {app.utils.Storage} storage
         * @param {app.User} user
         * @param {app.MultiAccount} multiAccount
         */
        constructor($log, $state, storage, user, multiAccount) {
            this.$log = $log;
            this.$state = $state;
            this.storage = storage;
            this.user = user;
            this.multiAccount = multiAccount;
        }

        /**
         * @public
         * @param {string} publicKeyTo
         * @param {string} privateKeyFrom
         * @returns {Promise<{password: string, storageData: Object}>}
         */
        async export(privateKeyFrom, publicKeyTo) {
            const keys = [
                'multiAccountData',
                'multiAccountUsers',
                'multiAccountSettings',
                'multiAccountHash',
                'userList',
                'openClientMode'
            ];

            const storageData = {};

            for (const key of keys) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    const value = await this.storage.load(key);

                    storageData[key] = value;
                } catch (e) {
                    this.$log.error(`Could not read key "${key}" from storage. Error:`, e);
                }
            }

            return this.multiAccount.export(privateKeyFrom, publicKeyTo, storageData);
        }

        /**
         * @public
         * @param {Object} data
         * @param {string} data.password
         * @param {Object} data.storageData
         * @returns {Promise<void>}
         */
        async import(data) {
            const multiAccountData = await this.storage.load('multiAccountData');

            if (!multiAccountData) {
                const signUpResult = await this.multiAccount.signUp(
                    data.password,
                    this.user.getSetting('encryptionRounds')
                );

                await this.user.saveMultiAccount(signUpResult);
            }

            if (this.multiAccount.isSignedIn) {
                await this._importData(data);
                this._loginToFirstUser(data.password);
            } else {
                this.user.loginSignal.once(async () => {
                    await this._importData(data);
                    this._loginToFirstUser(data.password);
                });
            }
        }

        /**
         * @private
         * @param {Object} data
         * @param {string} data.password
         * @param {Object} data.storageData
         * @returns {Promise<void>}
         */
        async _importData(data) {
            const { multiAccountData, multiAccountUsers, ...rest } = data.storageData;

            await this._importMultiAccountUsers(multiAccountData, multiAccountUsers, data.password);

            for (const [key, value] of Object.entries(rest)) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await this._importDataItem(key, value);
                } catch (e) {
                    this.$log.error(e);
                }
            }

            const multiAccountSettings = await this.user.getMultiAccountSettings();

            this.user.setMultiAccountSettings(multiAccountSettings);
        }

        /**
         * @private
         * @param {string} key
         * @param {any} value
         * @returns {Promise<void>}
         */
        async _importDataItem(key, value) {
            const valueFromStorage = await this.storage.load(key);

            return !valueFromStorage ?
                this.storage.save(key, value) :
                Promise.resolve();
        }

        /**
         * @private
         * @param {string} multiAccountData
         * @param {Object} multiAccountUsers
         * @param {string} password
         */
        async _importMultiAccountUsers(multiAccountData, multiAccountUsers, password) {
            let currentMultiAccountUsers = await this.storage.load('multiAccountUsers');

            if (!currentMultiAccountUsers) {
                currentMultiAccountUsers = Object.create(null);
            }

            try {
                const users = JSON.parse(decryptSeed(
                    multiAccountData,
                    password,
                    this.user.getSetting('encryptionRounds')
                ));

                for (const [hash, user] of Object.entries(users)) {
                    if (!currentMultiAccountUsers[hash]) {
                        currentMultiAccountUsers[hash] = multiAccountUsers[hash];
                        // eslint-disable-next-line no-await-in-loop
                        const { multiAccountData, multiAccountHash } = await this.multiAccount.addUser(user);
                        // eslint-disable-next-line no-await-in-loop
                        await this.user.saveMultiAccount({ multiAccountData, multiAccountHash });
                    }
                }

                await this.storage.save('multiAccountUsers', currentMultiAccountUsers);
            } catch (e) {
                this.$log.error(e);

                return Promise.resolve();
            }
        }

        /**
         * @private
         * @param {string} password
         */
        async _loginToFirstUser(password) {
            const multiAccountData = await this.user.getMultiAccountData();
            const multiAccountHash = await this.user.getMultiAccountHash();

            await this.multiAccount.signIn(
                multiAccountData,
                password,
                this.user.getSetting('encryptionRounds'),
                multiAccountHash
            );

            const [firstUser] = await this.user.getMultiAccountUsers();

            if (firstUser) {
                this.user.logout('switch', true);
                await this.user.login(firstUser);
                this.user.goToActiveState();
            } else {
                this.$state.go('create');
            }
        }

    }

    angular.module('app').service('storageImporter', StorageImporter);
})();
