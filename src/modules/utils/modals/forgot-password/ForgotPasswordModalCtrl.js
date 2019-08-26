(function () {
    'use strict';

    const controller = function (Base, $scope, $mdDialog, user, notification) {

        class ForgotPasswordModalCtrl extends Base {

            constructor() {
                super($scope);
            }

            onReset() {
                user.resetAll().then(() => {
                    $mdDialog.hide();

                    notification.info({
                        ns: 'app.signIn',
                        title: { literal: 'signIn.modal.forgotPass' }
                    });
                });
            }

        }

        return new ForgotPasswordModalCtrl();
    };

    controller.$inject = ['Base', '$scope', '$mdDialog', 'user', 'notification'];

    angular.module('app.utils').controller('ForgotPasswordModalCtrl', controller);
})();
