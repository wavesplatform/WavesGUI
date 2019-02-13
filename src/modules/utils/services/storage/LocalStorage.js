(function () {
    'use strict';

    /**
     * @param {storageDataConverter} storageDataConverter
     * @return {LocalStorage} localStorage
     */
    const factory = function (storageDataConverter) {

        /**
         * @type LocalStorage
         */
        class LocalStorage {

            static storage = null;

            /**
             * @param {string} key
             * @return {Promise<any>}
             */
            read(key) {
                const api = LocalStorage.getStorage();
                const result = api.getItem(key);
                let data = result;
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    return data;
                }
                return storageDataConverter.parse(data);
            }

            /**
             * @param {string} key
             * @param {any} value
             * @return {Promise<any>}
             */
            write(key, value) {
                const api = LocalStorage.getStorage();
                try {
                    api.setItem(key, storageDataConverter.stringify(value));
                    return Promise.resolve(null);
                } catch (e) {
                    return Promise.resolve(e);
                }
            }

            /**
             * @return {Promise<any>}
             */
            clear() {
                const api = LocalStorage.getStorage();
                try {
                    api.clear();
                    return Promise.resolve(null);
                } catch (e) {
                    return Promise.resolve(e);
                }
            }

            /**
             * @return {null}
             */
            onUpdate() {
                return null;
            }

            /**
             * @return {void}
             */
            init() {
                LocalStorage.getStorage();
            }

            /**
             * @return {boolean}
             */
            canIUse() {
                try {
                    const storage = getStorageApi();
                    storage.setItem('___test', String(Date.now()));
                    return true;
                } catch (e) {
                    return false;
                }
            }

            static getStorage() {
                if (!LocalStorage.storage) {
                    LocalStorage.storage = getStorageApi();
                }

                return LocalStorage.storage;
            }

        }

        return new LocalStorage();
    };

    factory.$inject = ['storageDataConverter'];

    angular.module('app.utils').factory('localStorage', factory);

    function getStorageApi() {
        return localStorage;
    }
})();

