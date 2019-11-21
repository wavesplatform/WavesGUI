(() => {
    'use strict';

    class DexwLockedCtrl {

        static $inject = ['$scope', 'user'];

        /**
         * @type {boolean}
         */
        isDesktop = false;
        /**
         * @type {'new' | 'old' | 'multiAccount'}
         */
        userType = 'new';

        constructor($scope, user) {
            this.$scope = $scope;
            this.user = user;
        }

        $onInit() {
            this.isDesktop = WavesApp.isDesktop();
            Promise.all([
                this.user.getMultiAccountUsers(),
                this.user.getFilteredUserList()
            ]).then(([multiAccountUsers, userList]) => {
                if (userList && userList.length && (!multiAccountUsers || multiAccountUsers.length === 0)) {
                    this.userType = 'old';
                } else if (multiAccountUsers && multiAccountUsers.length) {
                    this.userType = 'multiAccount';
                } else {
                    this.userType = 'new';
                }
                this.$scope.$apply();
            });
        }

    }

    angular.module('app.welcome').component('wDexwLocked', {
        templateUrl: 'modules/welcome/components/dexwLocked/dexwLocked.html',
        controller: DexwLockedCtrl
    });
})();
