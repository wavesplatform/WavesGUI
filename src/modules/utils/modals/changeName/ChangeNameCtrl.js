(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {UserNameService} userNameService
     * @param {User} user
     * @param {INotification} notification
     * @param $mdDialog
     * @return {ChangeNameCtrl}
     */
    const controller = function (Base, $scope, userNameService, user, notification, $mdDialog) {

        class ChangeNameCtrl extends Base {

            /**
             * @public
             * @type {string}
             */
            userName;

            constructor() {
                super($scope);

                $scope.user = user;
                $scope.MAX_USER_NAME_LENGTH = userNameService.MAX_USER_NAME_LENGTH;

                this.userName = userNameService.name;

                this.observe('userName', () => {
                    userNameService.setName(this.userName);
                });
            }

            /**
             * @public
             */
            onSave() {
                userNameService.save();
                notification.info({
                    ns: 'app.welcome',
                    title: {
                        literal: 'welcome.nameSaved'
                    }
                });
                $mdDialog.cancel();
            }

            /**
             * @public
             */
            onCancel() {
                userNameService.setName(user.name);
                $mdDialog.cancel();
            }

        }

        return new ChangeNameCtrl();
    };

    controller.$inject = ['Base', '$scope', 'userNameService', 'user', 'notification', '$mdDialog'];

    angular.module('app.utils')
        .controller('ChangeNameCtrl', controller);
})();
