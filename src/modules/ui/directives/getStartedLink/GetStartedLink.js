(function () {
    'use strict';

    const controller = function (Base, user, $scope, angularUtils) {

        class GetStartedLinkCtrl extends Base {

            hasMultiAccount;
            hasSignIn;
            hasCreate;
            hasImport;

            constructor() {
                super($scope);
                this.hovered = false;
                this._init();
            }

            /**
             * @private
             */
            _init() {
                user.getMultiAccountData().then(data => {
                    this.hasMultiAccount = !!data;
                    angularUtils.postDigest($scope).then(() => {
                        $scope.$apply();
                    });
                });
            }

        }

        return new GetStartedLinkCtrl();
    };

    controller.$inject = ['Base', 'user', '$scope', 'utils'];

    angular.module('app.ui').component('wGetStartedLink', {
        templateUrl: 'modules/ui/directives/getStartedLink/getStartedLink.html',
        bindings: {
            hasSignIn: '<',
            hasCreate: '<',
            hasImport: '<'
        },
        controller
    });

})();
