(function () {
    'use strict';

    /**
     * @return postmessageStorage
     */
    const factory = function () {

        class PostMessageStorage {

            /**
             * @type {User}
             */
            user;

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
                    .then(() => api.request('writeData', { [key]: value }))
                    .then((data) => {
                        return data;
                    })
                    .then(data => (this._data = data));
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
                api.on('data', cb);
            }

            /**
             * @return {PostMessageStorage}
             */
            init() {
                const api = PostMessageStorage._getStorage();

                this.readyPromise = new Promise((resolve) => {
                    api.once('logout', () => this.user.logout());

                    api.registerRequestHandler('demo', () => {
                        this.user.showDemo();
                    });

                    api.registerRequestHandler('login', (user) => {
                        resolve();
                        this._data = { user };
                        this.user.loginByData(user)
                            .then(() => api.dispatchEvent('loginOk', { status: 'ok' }))
                            .catch(error => api.dispatchEvent('loginError', { status: 'error', error }));

                        return { status: 'ok' };
                    });
                });
            }

            /**
             * @param {User} user
             */
            setUser(user) {
                this.user = user;
            }

            _setUserSettings(settings) {
                if (!settings) {
                    return this.clear();
                }

                Object.entries(settings).forEach(([key, value]) => {
                    this.user.setSetting(key, value);
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
            { win: window.opener || window, origin: location.origin },
            { win: window, origin: location.origin }
        );

        return new Bus(adapter);
    }
})();

