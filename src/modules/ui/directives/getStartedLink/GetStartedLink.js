(function () {
    'use strict';

    const controller = function (Base, user, $scope, angularUtils) {

        const { utils } = require('@waves/signature-generator');

        class GetStartedLinkCtrl extends Base {

            /**
             * @private
             * @type {Array}
             */
            _userList = [];

            constructor() {
                super($scope);
                this.hovered = false;
                this._initUserList();
            }

            /**
             * @private
             */
            _initUserList() {
                user.getUserList()
                    .then((list) => {
                        this._userList = list.filter(user => utils.crypto.isValidAddress(user.address));
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
