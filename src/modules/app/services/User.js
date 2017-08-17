(function () {
    'use strict';

    /**
     * @param {Storage} storage
     * @returns {User}
     */
    const factory = function (storage) {

        class User {

            setUserData(data) {

            }

            saveToStorage() {

            }
        }


        return new User();
    };

    factory.$inject = ['Storage'];

    angular.module('app').factory('User', factory);
})();
