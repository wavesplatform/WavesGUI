(() => {
    'use strict';

    class DexwLockedCtrl {

        static $inject = [
            '$scope',
            'user',
            'modalManager'
        ];

        /**
         * @type {'new' | 'multiAccount'}
         */
        userType = 'new';

        /**
         * @return {boolean}
         */
        get isAuthorised() {
            return this.user.isAuthorised;
        }

        constructor($scope, user, modalManager) {
            this.$scope = $scope;
            this.user = user;
            this.modalManager = modalManager;
        }

        $onInit() {
            this.user.getMultiAccountUsersCount()
                .then((multiAccountCount) => {
                    if (multiAccountCount) {
                        this.userType = 'multiAccount';
                    } else {
                        this.userType = 'new';
                    }
                    this.$scope.$apply();
                });
        }

        onSign() {
            Promise.all([
                this.user.getMultiAccountUsers(),
                this.user.getMultiAccountSettings()
            ])
                .then(([multiAccountUsers, commonSettings]) => {
                    const [firstUser] = multiAccountUsers;

                    this.user.setMultiAccountSettings(commonSettings);

                    if (firstUser) {
                        return this.user.login(firstUser);
                    } else {
                        return Promise.resolve();
                    }

                })
                .then(() => {
                    this.modalManager.showExportAccount();
                    this.$scope.$apply();
                })
                .catch(() => {
                    return null;
                });
        }

    }

    angular.module('app.welcome').component('wDexwLocked', {
        templateUrl: 'modules/welcome/components/dexwLocked/dexwLocked.html',
        controller: DexwLockedCtrl
    });
})();
