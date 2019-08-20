(function () {
    'use strict';

    const controller = function (Base, $scope, $mdDialog, user, multiAccount, notification) {

        class PasswordModalCtrl extends Base {

            /**
             * @type {ng.IFormController|null}
             */
            form = null;
            /**
             * @type {string}
             */
            oldPassword = '';
            /**
             * @type {string}
             */
            password = '';
            /**
             * @type {string}
             */
            confirmPassword = '';
            /**
             * @type {boolean}
             */
            showPasswordError = false;

            constructor() {
                super($scope);

                this.observe('oldPassword', this._hidePasswordError);
            }

            onSubmit() {
                this._hidePasswordError();

                Promise.all([
                    user.getMultiAccountData(),
                    user.getMultiAccountHash()
                ]).then(([data, hash]) => {
                    return multiAccount.changePassword(
                        data,
                        this.oldPassword,
                        this.password,
                        user.getSetting('encryptionRounds'),
                        hash
                    );
                }).then(data => {
                    return user.saveMultiAccount(data);
                }).then(() => {
                    $mdDialog.hide();

                    notification.info({
                        ns: 'app.utils',
                        title: { literal: 'Password was changed successfully' } // TODO:1978 i18n
                    });
                }).catch(() => {
                    this._showPasswordError();
                });
            }

            _showPasswordError() {
                this.showPasswordError = true;
            }

            _hidePasswordError() {
                this.showPasswordError = false;
            }

        }

        return new PasswordModalCtrl();
    };

    controller.$inject = ['Base', '$scope', '$mdDialog', 'user', 'multiAccount', 'notification'];

    angular.module('app.utils').controller('PasswordModalCtrl', controller);
})();
