(function () {
    'use strict';

    /**
     *
     * @param {Storage} storage
     * @returns {WelcomeService}
     */
    const factory = function (storage) {

        class WelcomeService {

            getUserList() {
                return storage.load('userList').then((list) => {
                    list = list || [];

                    list.sort((a, b) => {
                        return a.lastLogin - b.lastLogin;
                    }).reverse();

                    return list;
                });
            }

        }

        return new WelcomeService();
    };

    factory.$inject = ['Storage'];

    angular.module('app.welcome').factory('WelcomeService', factory);
})();
