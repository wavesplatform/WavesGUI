(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {ConfigService} configService
     * @param {User} user
     * @param $state
     * @return {MigrationCtrl}
     */
    const controller = function (
        Base,
        $scope,
        configService,
        user,
        $state
    ) {

        const PATH = 'modules/migration/templates';

        class MigrationCtrl extends Base {

            /**
             * @type {string}
             */
            template = `${PATH}/migrate.html`;

            constructor() {
                super($scope);

                Promise.all([
                    user.getMultiAccountUsersCount(),
                    user.getFilteredUserList()
                ])
                    .then(([multiAccountUsersCount, legacyUsers]) => {
                        const hasUsersInLocalStorage = multiAccountUsersCount ||
                            (legacyUsers && legacyUsers.length);

                        if ((!user.isAuthorised && hasUsersInLocalStorage)) {
                            $state.go('signIn');
                        }

                        if (!hasUsersInLocalStorage && configService.get('DEXW_LOCKED')) {
                            this.template = `${PATH}/dexMoving.html`;
                        }
                    });
            }

        }

        return new MigrationCtrl();
    };


    controller.$inject = [
        'Base',
        '$scope',
        'configService',
        'user',
        '$state'
    ];

    angular.module('app.migration')
        .controller('MigrationCtrl', controller);
})();
