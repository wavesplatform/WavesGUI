(function () {
    'use strict';

    /**
     * @param {Storage} storage
     * @returns {User}
     */
    const factory = function (storage, $q, $state) {

        class User {

            constructor() {
                /**
                 * @type {string}
                 */
                this.address = null;
                /**
                 * @type {string}
                 */
                this.encryptedSeed = null;
                /**
                 * @type {number}
                 */
                this.lastConfirmPassword = null;
                /**
                 * @type {number}
                 */
                this.lastNotificationTimeStamp = null;
                /**
                 * @type {IUserSettings}
                 * @private
                 */
                this._settings = Object.create(null);
                /**
                 * @type {number}
                 */
                this.lastLogin = Date.now();
                /**
                 * @type {Deferred}
                 * @private
                 */
                this._dfr = $q.defer();
                /**
                 * @type {Object}
                 * @private
                 */
                this._props = Object.create(null);

                this._setObserve();
            }

            /**
             * @param {Object} data
             * @param {string} data.address
             * @param {string} data.encryptedSeed
             */
            setUserData(data) {
                Object.keys(data).forEach((key) => {
                    this[key] = data[key];
                });

                this._check();

                return this._save().catch((e) => {
                    console.log(e);
                });
            }

            /**
             * @param {string} name
             */
            getSetting(name) {
                return this._settings[name];
            }

            /**
             * @param {string} name
             * @param {*} value
             */
            setSetting(name, value) {
                this._settings[name] = value;
                this._save();
            }

            /**
             * @return {Object} data
             * @return {string} data.address
             * @return {string} data.encryptedSeed
             * @return {number} data.lastConfirmPassword
             * @return {number} data.lastNotificationTimeStamp
             * @return {number} data.lastLogin
             */
            getUserData() {
                return this._getPublicProps();
            }

            /**
             * @return {Promise}
             */
            login() {
                $state.go('welcome');
                return this._dfr.promise;
            }

            /**
             * @param {Object} data
             * @param {string} data.address
             * @param {string} data.encryptedSeed
             * @returns Promise
             */
            addUserData(data) {
                this._loadUserByAddress(data.address).then((item) => {
                    tsUtils.merge(this, item, data);
                    this.lastLogin = Date.now();

                    return this._save().then(() => {
                        this._dfr.resolve();
                    });
                });
            }

            /**
             * @returns {Promise}
             */
            getUserList() {
                return storage.load('userList').then((list) => {
                    list = list || [];

                    list.sort((a, b) => {
                        return a.lastLogin - b.lastLogin;
                    }).reverse();

                    return list;
                });
            }

            /**
             * @private
             */
            _setObserve() {
                Object.keys(this)
                    .filter((item) => item.charAt(0) !== '_')
                    .forEach((key) => {
                        this._observe(key, this);
                    });
            }

            /**
             * @param {string} key
             * @param {object} target
             * @private
             */
            _observe(key, target) {
                this._props[key] = target[key];
                Object.defineProperty(target, key, {
                    get: () => this._props[key],
                    set: (value) => {
                        this._props[key] = value;
                        this._save();
                    }
                });
            }

            /**
             * @private
             */
            _check() {
                if (!this.address || !this.encryptedSeed) {
                    // TODO Need addUserData!
                    throw new Error('No address!');
                }
            }

            /**
             * @returns {Promise}
             * @private
             */
            _save() {
                return storage.load('userList').then((list) => {
                    list = list || [];
                    let item = tsUtils.find(list, { address: this.address });

                    if (!item) {
                        item = Object.create(null);
                        list.push(item);
                    }

                    tsUtils.merge(item, this._getPublicProps());

                    return storage.save('userList', list);
                });
            }

            _loadUserByAddress(address) {
                return storage.load('userList').then((list) => {
                    return tsUtils.find(list || [], { address }) || Object.create(null);
                });
            }

            /**
             * @return {*}
             * @private
             */
            _getPublicProps() {
                return Object.keys(this).reduce((result, item) => {
                    if (item.charAt(0) !== '_' && this[item]) {
                        result[item] = this[item];
                    }
                    return result;
                }, Object.create(null));
            }

        }


        return new User();
    };

    factory.$inject = ['storage', '$q', '$state'];

    angular.module('app').factory('user', factory);
})();

/**
 * @typedef {Object} IUserSettings
 * @property {Array<string>} assets
 */
