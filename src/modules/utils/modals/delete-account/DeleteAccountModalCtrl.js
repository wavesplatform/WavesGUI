(function () {
    'use strict';

    const controller = function (Base, $scope, $mdDialog, user) {

        class DeleteAccountModalCtrl extends Base {

            constructor() {
                super($scope);
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
