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
                        ns: 'app.utils',
                        title: { literal: '???' } // TODO:1978 i18n
                    });
                });
            }

        }

        return new ForgotPasswordModalCtrl();
    };

    controller.$inject = ['Base', '$scope', '$mdDialog', 'user', 'notification'];

    angular.module('app.utils').controller('ForgotPasswordModalCtrl', controller);
})();
