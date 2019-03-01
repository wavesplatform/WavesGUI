(function () {
    'use strict';

    const controller = function (Base, $scope, user, $mdDialog) {

        class TermsAcceptCtrl extends Base {

            constructor() {
                super($scope);
                this.security = false;
                this.backup = false;
                this.shareAnalytics = false;
            }

            confirm() {
                // user.setSetting('shareAnalytics', this.shareAnalytics);
                $mdDialog.hide();
            }

        }

        return new TermsAcceptCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', '$mdDialog'];

    angular.module('app.utils').controller('TermsAcceptCtrl', controller);
})();
