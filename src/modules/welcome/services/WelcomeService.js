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
                return storage.load('userList');
            }

        }

        return new WelcomeService();
    };

    factory.$inject = ['Storage'];

    angular.module('app.welcome').factory('WelcomeService', factory);
})();
