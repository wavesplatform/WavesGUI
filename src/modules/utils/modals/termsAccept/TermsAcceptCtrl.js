(function () {
    'use strict';

    const controller = function (Base, $scope, user, $mdDialog) {

        class TermsAcceptCtrl extends Base {

            constructor() {
                super($scope);
                this.securityAndBackup = false;
                this.readTermsAndConditions = false;
                this.privacyPolicy = false;
            }

            confirm() {
                $mdDialog.hide();
            }

        }

        return new TermsAcceptCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', '$mdDialog'];

    angular.module('app.utils').controller('TermsAcceptCtrl', controller);
})();
