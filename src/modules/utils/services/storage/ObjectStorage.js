(function () {
    'use strict';

    /**
     * @param {storageDataConverter} storageDataConverter
     * @return objectStorage
     */
    const factory = function (storageDataConverter) {

        class ObjectStorage {

            static storage = null;

            /**
             * @param {string} key
             * @return {Promise<any>}
             */
            read(key) {
                const api = ObjectStorage.getStorage();
                const result = api[key];
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
                const api = ObjectStorage.getStorage();
                try {
                    api[key] = storageDataConverter.stringify(value);
                    return Promise.resolve(null);
                } catch (e) {
                    return Promise.resolve(null);
                }
            }

            /**
             * @return {Promise<any>}
             */
            clear() {
                ObjectStorage.storage = Object.create(null);
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
                ObjectStorage.getStorage();
            }

            static getStorage() {
                if (!ObjectStorage.storage) {
                    ObjectStorage.storage = Object.create(null);
                }

                return ObjectStorage.storage;
            }

        }

        return new ObjectStorage();
    };

    factory.$inject = ['storageDataConverter'];

    angular.module('app.utils').factory('objectStorage', factory);
})();

