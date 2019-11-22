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
        /**
         * @type {string}
         */
        wavesExchangeLink = WavesApp.network.wavesExchangeLink;

        constructor($scope, user) {
            this.$scope = $scope;
            this.user = user;
        }

        $onInit() {
            this.isDesktop = WavesApp.isDesktop();
            Promise.all([
                this.user.getMultiAccountUsersCount(),
                this.user.getFilteredUserList()
            ]).then(([multiAccountCount, userList]) => {
                if (userList && userList.length && multiAccountCount === 0) {
                    this.userType = 'old';
                } else if (multiAccountCount) {
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
