(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @param {app.utils} utils
     * @return {ExportAccountsCtrl}
     */
    const controller = function (Base, $scope, user, utils) {

        const { encryptSeed } = require('@waves/waves-transactions').seedUtils;
        const { crypto } = require('@waves/waves-transactions').libs;

        class ExportAccountsCtrl extends Base {

            /**
             * @type {{}}
             */
            checkedHash = {};
            /**
             * @type {boolean}
             */
            needPassword = false;
            /**
             * @type {Array}
             */
            userlist = [];
            /**
             * @type {string}
             */
            password = '';
            /**
             * @type {{ lastOpenVersion: string }}
             */
            settings = { lastOpenVersion: null };

            constructor() {
                super($scope);
                this.settings = user.getMultiAccountSettings();
                this.userList = [];
                this.checkedHash[user.address] = true;
                this.selectIsVisible = true;
                user.getMultiAccountSettings().then(settings => {
                    this.settings = settings;
                });
                user.getMultiAccountUsers().then(
                    (users) => {
                        this.userList = Array.isArray(users) ? users : [];
                        this.onSelect();
                        utils.safeApply($scope);
                    }
                );
            }

            toggleSelect(address) {
                this.checkedHash[address] = !this.checkedHash[address];
                this.onSelect();
            }

            onSelect() {
                this.hasSelected = !!Object.values(this.checkedHash).filter(Boolean).length;
            }

            selectAll() {
                this.userList.forEach((user) => {
                    this.checkedHash[user.address] = true;
                });
                this.onSelect();
                this.selectIsVisible = !this.selectIsVisible;
            }

            unselectAll() {
                this.userList.forEach((user) => {
                    this.checkedHash[user.address] = false;
                });
                this.onSelect();
                this.selectIsVisible = !this.selectIsVisible;
            }

            onSubmit() {
                const users = Object.entries(this.checkedHash)
                    .filter(item => item[1])
                    .map(([address]) => this.userList.find(user => user.address === address));
                const stringifyUsers = JSON.stringify(users);
                const saveUsers = !this.needPassword ?
                    stringifyUsers :
                    encryptSeed(stringifyUsers, this.password, 10000);

                const saveData = {
                    encrypted: this.needPassword,
                    encryptionRounds: this.needPassword ? 10000 : undefined,
                    saveUsers
                };

                const toSave = {
                    type: 'wavesBackup',
                    lastOpenVersion: this.settings.lastOpenVersion,
                    data: crypto.base64Encode(crypto.stringToBytes(JSON.stringify(saveData)))
                };

                utils.downloadFile(`accountsBackup-${Date.now()}.json`, JSON.stringify(toSave, null, 4));
            }

        }

        return new ExportAccountsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils'];

    angular.module('app.utils').controller('ExportAccountsCtrl', controller);
})();
