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
        const { publicKey: getPublicKey, address: getAddress, base58Decode } = crypto;
        const checkAccount = (account) => {
            if (!account) {
                return false;
            }

            const { address, userType, networkByte } = account;

            let publicKey = '';


            switch (userType) {
                case 'seed':
                    try {
                        if (/^base58:/.test(account.seed)) {
                            publicKey = getPublicKey(base58Decode(account.seed.replace('base58:', '')));
                        } else {
                            publicKey = getPublicKey(account.seed);
                        }
                    } catch (e) {
                        return false;
                    }
                    break;
                case 'privateKey':
                    try {
                        publicKey = getPublicKey({ privateKey: account.privateKey });
                    } catch (e) {
                        return false;
                    }
                    break;
                default:
                    publicKey = account.publicKey;
            }

            const myAddress = getAddress({ publicKey }, networkByte);

            return myAddress === address;
        };

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
             * @type {boolean}
             */
            selectIsVisible = true;
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
                        this.userList = (Array.isArray(users) ? users : []).filter(checkAccount);
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
                const selected = Object.values(this.checkedHash).filter(Boolean).length;
                const total = (this.userList || []).length;
                this.hasSelected = !!selected;
                this.selectIsVisible = selected !== total;
            }

            selectAll() {
                this.userList.forEach((user) => {
                    this.checkedHash[user.address] = true;
                });
                this.onSelect();
            }

            unselectAll() {
                this.userList.forEach((user) => {
                    this.checkedHash[user.address] = false;
                });
                this.onSelect();
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

                const dataToSaveInBytes = crypto.stringToBytes(JSON.stringify(saveData));

                saveData.hashSum = crypto.base58Encode(crypto.sha256(dataToSaveInBytes));

                const toSave = {
                    type: 'wavesBackup',
                    lastOpenVersion: this.settings.lastOpenVersion,
                    data: crypto.base64Encode(crypto.stringToBytes(JSON.stringify(saveData))),
                    checkSum: saveData.hashSum,
                    time: Date.now()
                };

                utils.downloadFile(`accountsBackup-${toSave.time}.json`, JSON.stringify(toSave, null, 4));
            }

        }

        return new ExportAccountsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils'];

    angular.module('app.utils').controller('ExportAccountsCtrl', controller);
})();
