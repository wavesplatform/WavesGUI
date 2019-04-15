(function () {
    'use strict';

    /**
     * @param {objectStorage} objectStorage
     * @param {LocalStorage} localStorage
     * @param {webStorage} webStorage
     * @param {postmessageStorage} postmessageStorage
     * @return {function: objectStorage|localStorage|webStorage|postmessageStorage} storageSelect
     */
    const factory = function (objectStorage, localStorage, webStorage, postmessageStorage) {

        return () => {
            if (WavesApp.isDesktop()) {
                return webStorage;
            }

            if (WavesApp.isMock) {
                return objectStorage;
            }

            if (WavesApp.usePostMessageStorage) {
                return postmessageStorage;
            }

            if (localStorage.canIUse()) {
                return localStorage;
            }

            return objectStorage;
        };
    };

    factory.$inject = ['objectStorage', 'localStorage', 'webStorage', 'postmessageStorage'];

    angular.module('app.utils').factory('storageSelect', factory);
})();

