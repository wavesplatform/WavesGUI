(function () {
    'use strict';

    const analytics = require('@waves/event-sender');

    const controller = function (Base, $scope, $mdDialog, $state, user) {

        class ForgotPasswordModalCtrl extends Base {

            constructor() {
                super($scope);
            }

            onReset() {
                user.resetAll().then(() => {
                    $mdDialog.hide();
                    $state.go('welcome');
                });

                analytics.send({ name: 'Reset All' });
            }

        }

        return new ForgotPasswordModalCtrl();
    };

    controller.$inject = ['Base', '$scope', '$mdDialog', '$state', 'user'];

    angular.module('app.utils').controller('ForgotPasswordModalCtrl', controller);
})();
