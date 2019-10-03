(function () {
    'use strict';

    const networkByte = (WavesApp.network.code || 'W').charCodeAt(0);
    const { libs } = require('@waves/waves-transactions');

    const getName = (names, name) => {
        let index = 0;

        do {
            name = `${name}_${index}`;
            index++;
        } while (names.includes(name));

        return name;
    };

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
             * @type {boolean}
             */
            emptyError = false;

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
            selectIsVisible = true;

            /**
             * @type {boolean}
             */
            exportError = false;

            /**
             * @type {Array}
             */
            originalUsers = [];

            constructor() {
                super($scope);
                this.selectIsVisible = true;
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

                const hashSum = dataObject.hashSum;

                delete dataObject.hashSum;

                const savedDataHash = libs.crypto.base58Encode(
                    libs.crypto.sha256(libs.crypto.stringToBytes(JSON.stringify(dataObject)))
                );

                if (savedDataHash !== hashSum) {
                    throw new Error('Fail is corrupted');
                }

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
                const total = (this.decryptedData.saveUsers || []).length;
                const selected = Object.values(this.checkedHash).filter(Boolean).length;
                this.hasSelected = !!selected;
                this.selectIsVisible = total !== selected;
            }

            selectAll() {
                (this.decryptedData.saveUsers || []).forEach((user) => {
                    this.checkedHash[user.address] = true;
                });
                this.onSelect();
            }

            unselectAll() {
                (this.decryptedData.saveUsers || []).forEach((user) => {
                    this.checkedHash[user.address] = false;
                });
                this.onSelect();
            }

            next() {
                if (this.step === 0 && this.backup && this.backup.encrypted) {
                    user.getMultiAccountUsers().then(users => {
                        this.originalUsers = users;
                        this.password = '';
                        this.step = 1;
                        utils.safeApply($scope);
                    });
                } else if (this.step === 0 && this.backup && !this.backup.encrypted) {
                    this.password = '';
                    this.decryptedData = { ...this.backup };
                    this.decryptedData.saveUsers = typeof this.decryptedData.saveUsers === 'string' ?
                        JSON.parse(this.decryptedData.saveUsers) :
                        this.decryptedData.saveUsers;
                    this.remapUsers();
                    this.filterUsers();
                    this.selectFirst();
                    if (!this.emptyError) {
                        this.step = 2;
                    } else {
                        this.step = 0;
                    }
                } else if (this.step === 1 && this.password) {
                    const saveUsers = this.decryptData();
                    if (!this.passwordError) {
                        this.decryptedData = {
                            ...this.backup,
                            saveUsers
                        };
                        this.remapUsers();
                        this.filterUsers();
                        this.selectFirst();
                        if (!this.emptyError) {
                            this.step = 2;
                        } else {
                            this.step = 0;
                        }
                    }
                }
            }

            filterUsers() {
                this.decryptedData.saveUsers = this.decryptedData.saveUsers || [];
                const isDesktop = WavesApp.isDesktop();
                if (isDesktop) {
                    this.decryptedData.saveUsers = this.decryptedData.saveUsers
                        .filter((user) => user.userType !== 'wavesKeeper');
                }

                this.decryptedData.saveUsers = this.decryptedData.saveUsers
                    .filter((user) => user.networkByte === networkByte);

                if (!this.decryptedData.saveUsers || this.decryptedData.saveUsers.length === 0) {
                    this.emptyError = true;
                }
            }

            selectFirst() {
                const user = (this.decryptedData.saveUsers || [])[0];
                if (!user) {
                    return;
                }
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
                this.emptyError = false;
                if (event.target.files && event.target.files.length > 0) {
                    const file = event.target.files[0];
                    this.filename = file.name || '';
                    reader.readAsDataURL(file);

                    const userListPromise = user.getMultiAccountUsers().then(users => {
                        this.originalUsers = users;
                    });

                    const readerPromise = new Promise((resolve, reject) => {
                        reader.onload = resolve;
                        reader.onerror = reject;
                    });

                    Promise.all([userListPromise, readerPromise]).then(
                        () => {
                            const fileData = libs.crypto
                                .bytesToString(libs.crypto.base64Decode(reader.result.split(',')[1]));

                            this.backup = FromBackupCtrl.parseUsers(fileData);
                            this.readError = null;
                        }
                    ).catch(() => {
                        this.readError = 'wrongFile';
                    }).then(() => {
                        utils.safeApply($scope);
                    });

                }
            }

            remapUsers() {
                const fromBackup = this.decryptedData.saveUsers || [];
                const originalUsers = this.originalUsers.reduce((acc, user) => {
                    acc.names[user.name] = user;
                    acc.addresses[user.address] = user;
                    acc.publicKeys[user.publicKey] = user;
                    return acc;
                }, { names: {}, addresses: {}, publicKeys: {} });

                this.decryptedData.saveUsers = fromBackup.map(
                    (user) => {
                        const originalUser = originalUsers.addresses[user.address];
                        if (originalUser) {
                            return null;
                        }

                        if (originalUsers.names[user.name]) {
                            user.name = getName(Object.keys(originalUsers.names), user.name);
                        }

                        return user;
                    }
                )
                    .filter(Boolean);
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
