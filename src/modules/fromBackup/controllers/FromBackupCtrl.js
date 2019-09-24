(function () {
    'use strict';

    const { libs } = require('@waves/waves-transactions');

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {User} user
     * @param {app.utils} utils
     * @return {FromBackupCtrl}
     */
    const controller = function (Base, $scope, $state, user, utils) {

        const analytics = require('@waves/event-sender');

        class FromBackupCtrl extends Base {

            /**
             * @type {number}
             */
            step = 0;

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

            next() {
                if (this.step === 1 && this.backup && this.backup.encrypted) {
                    this.step = 2;
                } else if (this.step === 1 && this.backup && !this.backup.encrypted) {
                    this.decryptedData = this.backup;
                    this.step = 3;
                }
            }

            onSetPassword(e) {
                this.error = e;
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

            // /**
            //  * @return {void}
            //  */
            // login() {
            //     const newUser = {
            //         ...this.selectedUser,
            //         userType: this.adapter.type,
            //         networkByte: WavesApp.network.code.charCodeAt(0)
            //     };
            //
            //     return user.create(newUser, true, true).then(() => {
            //         $state.go(user.getActiveState('wallet'));
            //     }).catch(() => {
            //         this.error = true;
            //         $scope.$digest();
            //     });
            // }

        }

        return new FromBackupCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'utils'];

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
