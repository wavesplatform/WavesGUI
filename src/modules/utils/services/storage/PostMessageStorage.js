(function () {
    'use strict';

    /**
     * @return postmessageStorage
     */
    const factory = function () {

        class PostMessageStorage {

            /**
             * @type {Promise<any>}
             */
            readyPromise;

            /**
             * @type {Bus|null}
             */
            static storage = null;

            /**
             * @return {Bus}
             * @private
             */
            static _getStorage() {
                if (!PostMessageStorage.storage) {
                    PostMessageStorage.storage = _getStorageApi();
                }

                return PostMessageStorage.storage;
            }

            /**
             * @param {string} key
             * @return {Promise<T | never>}
             */
            read(key) {
                return this.readyPromise
                    .then(() => JSON.parse(this._data[key]))
                    .catch(() => this._data[key]);
            }

            /**
             * @param {string} key
             * @param {any} value
             * @return {Promise<any | never>}
             */
            write(key, value) {
                const api = PostMessageStorage._getStorage();
                return this.readyPromise
                    .then(() => api.request('updateData', { key: value }));
            }

            /**
             * @return {Promise<this | never>}
             */
            clear() {
                const api = PostMessageStorage._getStorage();
                return this.readyPromise
                    .then(() => api.dispatchEvent('clearData'));
            }

            /**
             * @param {function} cb
             * @return {null}
             */
            onUpdate(cb) {
                const api = PostMessageStorage._getStorage();
                api.on('setData', cb);
            }

            /**
             * @return {void}
             */
            init() {
                const api = PostMessageStorage._getStorage();
                api.once('init', () => api.request('getData'));
                this.readyPromise = new Promise((resolve) => {
                    api.once('setData', (data) => {
                        this._data = data;
                        resolve(data);
                    });
                });
            }

        }

        return new PostMessageStorage();
    };

    angular.module('app.utils').factory('postmessageStorage', factory);

    /**
     * @return {Bus}
     * @private
     */
    function _getStorageApi() {
        const { WindowAdapter, Bus } = require('@waves/waves-browser-bus');

        const adapter = new WindowAdapter(
            { win: window, origin: location.origin },
            { win: window.opener, origin: '*' }
        );

        return new Bus(adapter);
    }
})();

