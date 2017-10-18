(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @return {AccountInformationCtrl}
     */
    const controller = function (Base, $scope, user) {

        class AccountInformationCtrl extends Base {

            constructor() {
                super($scope);
                this.address = user.address;
                this.newAlias = '';
            }

            createAlias() {

            }

        }

        return new AccountInformationCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user'];

    angular.module('app.utils').controller('AccountInformationCtrl', controller);
})();
