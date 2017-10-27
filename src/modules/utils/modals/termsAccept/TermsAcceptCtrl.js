(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class TermsAcceptCtrl extends Base {

            constructor() {
                super($scope);
                this.security = false;
                this.backup = false;
                this.agree = false;
            }

            confirm() {
                this.agree = true;
            }

        }

        return new TermsAcceptCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('TermsAcceptCtrl', controller);
})();
