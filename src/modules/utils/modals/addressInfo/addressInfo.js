(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @return {ChangeAddressCtrl}
     */
    const controller = function (Base, $scope, user) {

        class AddressInfoCtrl extends Base {

            /**
             * @type {string}
             */
            userName;
            /**
             * @type {string}
             */
            address;
            /**
             * @type {string}
             */
            userType;

            constructor() {
                super($scope);
                this.userName = user.name;
                this.userType = user.userType;
                this.address = user.address;
            }

        }

        return new AddressInfoCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user'];

    angular.module('app.utils')
        .controller('AddressInfoCtrl', controller);
})();
