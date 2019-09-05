(function () {
    'use strict';

    const controller = function (Base, $scope, $mdDialog, user) {

        class DeleteAccountModalCtrl extends Base {

            /**
             * @type
             * @public
             */
            accountsWithoutBackup = [];

            constructor() {
                super($scope);

                user.getMultiAccountUsers().then(users => {
                    this.accountsWithoutBackup = users.filter(accountUser => (
                        !accountUser.settings ||
                        !accountUser.settings.hasBackup
                    ));

                    $scope.$digest();
                });
            }

            onDelete() {
                user.resetAll().then(() => {
                    $mdDialog.hide();
                    user.logout('welcome');
                });
            }

        }

        return new DeleteAccountModalCtrl();
    };

    controller.$inject = ['Base', '$scope', '$mdDialog', 'user'];

    angular.module('app.utils').controller('DeleteAccountModalCtrl', controller);
})();
