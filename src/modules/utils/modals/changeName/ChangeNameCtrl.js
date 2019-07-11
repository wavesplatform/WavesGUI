(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {UserNameService} userNameService
     * @param {User} user
     * @param {INotification} notification
     * @return {ChangeNameCtrl}
     */
    const controller = function (Base, $scope, userNameService, user, notification) {

        class ChangeNameCtrl extends Base {

            /**
             * @public
             * @type {string}
             */
            userName;
            /**
             * @public
             * @type {boolean}
             */
            isUniqueUserName = true;

            constructor() {
                super($scope);

                $scope.ERROR_DISPLAY_INTERVAL = 3;
                $scope.user = user;

                $scope.MAX_USER_NAME_LENGTH = userNameService.MAX_USER_NAME_LENGTH;
                this.userName = userNameService.name;
            }

            /**
             * @public
             */
            saveUserName() {
                userNameService.setName(this.userName);
                this.isUniqueUserName = userNameService.isUniqueName();
                if (this.isUniqueUserName) {
                    userNameService.save();
                }
                notification.info({
                    ns: 'app.welcome',
                    title: {
                        literal: 'welcome.nameSaved'
                    }
                });
            }

        }

        return new ChangeNameCtrl();
    };

    controller.$inject = ['Base', '$scope', 'userNameService', 'user', 'notification'];

    angular.module('app.utils')
        .controller('ChangeNameCtrl', controller);
})();
