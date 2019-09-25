(function () {
    'use strict';

    const { libs } = require('@waves/waves-transactions');

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {User} user
     * @param {app.utils} utils
     * @param {INotification} notification
     * @return {FromBackupCtrl}
     */
    const controller = function (Base, $scope, $state, user, utils, notification) {

        const analytics = require('@waves/event-sender');

        class FromBackupCtrl extends Base {

            /**
             * @type {number}
             */
            step = 0;

            /**
             * @type {string}
             */
            password = '';

            /**
             * @type {boolean}
             */
            passwordError = false;

            /**
             * @type {{}}
             */
            checkedHash = {};

            /**
             * @type {{}}
             */
            decryptedData = {};

            /**
             * @type {boolean}
             */
            hasSelected = false;

            /**
             * @type {boolean}
             */
            exportError = false;

            constructor() {
                super($scope);
                analytics.send({ name: 'Import From Backup Click', target: 'ui' });
            }

            static parseUsers(data) {
                const backup = JSON.parse(data);

                if (!backup || (backup.type !== 'wavesBackup' || !backup.lastOpenVersion)) {
                    throw new Error('wrongFile');
                }

                const dataObject = JSON.parse(
                    libs.crypto.bytesToString(libs.crypto.base64Decode(backup.data))
                );

                return {
                    ...dataObject,
                    type: backup.type,
                    lastOpenVersion: backup.lastOpenVersion
                };
            }

            toggleSelect(address) {
                this.checkedHash[address] = !this.checkedHash[address];
                this.onSelect();
            }

            onSelect() {
                this.hasSelected = !!Object.values(this.checkedHash).filter(Boolean).length;
            }

            selectAll() {
                (this.decryptedData.saveUsers || []).forEach((user) => {
                    this.checkedHash[user.address] = true;
                });
                this.onSelect();
            }

            next() {
                if (this.step === 0 && this.backup && this.backup.encrypted) {
                    this.password = '';
                    this.step = 1;
                } else if (this.step === 0 && this.backup && !this.backup.encrypted) {
                    this.password = '';
                    this.decryptedData = { ...this.backup };
                    this.decryptedData.saveUsers = typeof this.decryptedData.saveUsers === 'string' ?
                        JSON.parse(this.decryptedData.saveUsers) :
                        this.decryptedData.saveUsers;
                    this.selectFirst();
                    this.step = 2;
                } else if (this.step === 1 && this.password) {
                    const saveUsers = this.decryptData();
                    if (!this.passwordError) {
                        this.decryptedData = {
                            ...this.backup,
                            saveUsers
                        };
                        this.selectFirst();
                        this.step = 2;
                    }
                }
            }

            selectFirst() {
                const user = (this.decryptedData.saveUsers || [])[0];
                this.checkedHash = {
                    [user.address]: true
                };
                this.onSelect();
            }

            login(newUser) {
                user.login(newUser);
                notification.info({
                    ns: 'app.ui',
                    title: { literal: 'importSuccess' }
                });
                $state.go(user.getActiveState('wallet'));
            }

            decryptData() {
                try {
                    const data = { ...this.backup };
                    const users = JSON.parse(
                        libs.crypto.decryptSeed(data.saveUsers, this.password, data.encryptionRounds)
                    );
                    this.passwordError = !Array.isArray(users);
                    return users;
                } catch (e) {
                    this.passwordError = true;
                }
            }

            $onDestroy() {
                super.$onDestroy();
            }

            onFileChange(event) {
                const reader = new FileReader();
                if (event.target.files && event.target.files.length > 0) {
                    const file = event.target.files[0];
                    reader.readAsDataURL(file);
                    reader.onload = () => {
                        try {
                            const fileData = libs.crypto
                                .bytesToString(libs.crypto.base64Decode(reader.result.split(',')[1]));
                            this.backup = FromBackupCtrl.parseUsers(fileData);
                            this.readError = null;

                        } catch (e) {
                            this.readError = 'wrongFile';
                        }

                        utils.safeApply($scope);
                    };
                }
            }

            onSubmit() {
                const users = Object.entries(this.checkedHash)
                    .filter(item => item[1])
                    .map(
                        ([address]) => this.decryptedData.saveUsers.find(user => user.address === address)
                    );
                const promises = [];
                users.reduce(
                    (acc, newUser) => {
                        const userPromise = acc.then(() => user.addUser(newUser, true, true));
                        promises.push(userPromise);
                        return userPromise;
                    },
                    Promise.resolve()
                );

                Promise.all(promises)
                    .then(users => this.login(users[0]))
                    .catch(() => {
                        this.exportError = true;
                    });
            }

        }

        return new FromBackupCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'utils', 'notification'];

    angular.module('app.fromBackup').controller('FromBackupCtrl', controller);
    angular.module('app.fromBackup').directive('fileChange', ['$parse', function ($parse) {

        return {
            require: 'ngModel',
            restrict: 'A',
            link: function ($scope, element, attrs) {

                const attrHandler = $parse(attrs.fileChange);
                const handler = function (e) {
                    $scope.$apply(function () {
                        attrHandler($scope, { $event: e, files: e.target.files });
                    });
                };
                element[0].addEventListener('change', handler, false);
            }
        };
    }]);
})();
