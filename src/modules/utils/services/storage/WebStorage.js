/* global WebStorage */

(function () {
    'use strict';

    /**
     * @param {storageDataConverter} storageDataConverter
     * @return webStorage
     */
    const factory = function (storageDataConverter) {

        class WebStorage {

            static storage = null;

            /**
             * @param {string} key
             * @return {Promise<any>}
             */
            read(key) {
                const api = WebStorage._getStorage();
                api.readStorage(key).then((result) => {
                    let data = result;
                    try {
                        data = JSON.parse(result);
                    } catch (e) {
                        return data;
                    }

                    return storageDataConverter.parse(data);
                });
            }

            /**
             * @param {string} key
             * @param {any} value
             * @return {Promise<any>}
             */
            write(key, value) {
                const api = WebStorage._getStorage();
                return api.writeStorage(key, storageDataConverter.stringify(value));
            }

            /**
             * @return {Promise<any>}
             */
            clear() {
                const api = WebStorage._getStorage();
                return api.clearStorage();
            }

            /**
             * @return {null}
             */
            onUpdate() {
                return null;
            }

            init() {
                WebStorage._getStorage();
            }

            /**
             * @param {User} user
             */
            setUser(user) {
                this.user = user;
            }

            static _getStorage() {
                if (!WebStorage.storage) {
                    WebStorage.storage = _getStorageApi();
                }

                return WebStorage.storage;
            }

        }

        return new WebStorage();
    };

    factory.$inject = ['storageDataConverter'];

    angular.module('app.utils').factory('webStorage', factory);

    function _getStorageApi() {
        return WebStorage;
    }
})();

