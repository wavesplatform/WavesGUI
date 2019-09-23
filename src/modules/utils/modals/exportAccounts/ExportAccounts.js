(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @param {app.utils} utils
     * @return {ExportAccountsCtrl}
     */
    const controller = function (Base, $scope, user, utils) {

        class ExportAccountsCtrl extends Base {

            checkedHash = {};

            constructor() {
                super($scope);
                this.settings = user.getMultiAccountSettings();
                this.userList = [];
                this.checkedHash[user.address] = true;

                user.getMultiAccountUsers().then(
                    (users) => {
                        this.userList = users;
                        utils.safeApply($scope);
                    }
                );
            }

            toggleSelect(address) {
                this.checkedHash[address] = !this.checkedHash[address];
            }

            selectAll() {
                this.userList.forEach((user) => {
                    this.checkedHash[user.address] = true;
                });
            }

        }

        return new ExportAccountsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils'];

    angular.module('app.utils').controller('ExportAccountsCtrl', controller);
})();
