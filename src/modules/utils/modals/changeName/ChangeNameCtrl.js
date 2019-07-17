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
            /**
             * @public
             * @type {boolean}
             */
            isUniqueUserName = true;

            constructor() {
                super($scope);

                $scope.user = user;
                $scope.MAX_USER_NAME_LENGTH = userNameService.MAX_USER_NAME_LENGTH;

                this.userName = userNameService.name;

                this.observe('userName', () => {
                    userNameService.setName(this.userName);
                    this.isUniqueUserName = userNameService.isUniqueName();
                });

                this.observe('isUniqueUserName', () => {
                    if (this.setUserName) {
                        this.setUserName.userName.$setValidity('user-name-unique', this.isUniqueUserName);
                    }
                });
            }

            /**
             * @public
             */
            saveUserName() {
                if (this.isUniqueUserName) {
                    userNameService.save();
                    notification.info({
                        ns: 'app.welcome',
                        title: {
                            literal: 'welcome.nameSaved'
                        }
                    });
                    $mdDialog.cancel();
                }
            }

        }

        return new ChangeNameCtrl();
    };

    controller.$inject = ['Base', '$scope', 'userNameService', 'user', 'notification', '$mdDialog'];

    angular.module('app.utils')
        .controller('ChangeNameCtrl', controller);
})();
