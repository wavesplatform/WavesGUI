(function () {
    'use strict';

    const { pickBy, hasIn } = require('ramda');

    class StorageExporter {

        static $inject = [
            '$log',
            'storage',
            'multiAccount',
            'defaultSettings'
        ];

        /**
         * @param {ng.ILogService} $log
         * @param {app.utils.Storage} storage
         * @param {app.MultiAccount} multiAccount
         */
        constructor($log, storage, multiAccount, defaultSettings) {
            this.$log = $log;
            this.storage = storage;
            this.multiAccount = multiAccount;
            this.defaultSettings = defaultSettings;
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

            const predicate = (value, key) => hasIn(key, this.defaultSettings.create().getDefaultSettings());

            for (const user of Object.values(storageData.userList)) {
                delete user.settings.encryptionRounds;
                user.settings = pickBy(predicate)(user.settings);
            }

            return this.multiAccount.export(privateKeyFrom, publicKeyTo, storageData);
        }

    }

    angular.module('app').service('storageExporter', StorageExporter);
})();
