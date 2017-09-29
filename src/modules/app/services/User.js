(function () {
    'use strict';

    /**
     * @param {Storage} storage
     * @param {$q} $q
     * @param {*} $state
     * @param {app.defaultSettings} defaultSettings
     * @param {*} $mdDialog
     * @param {app.utils.apiWorker} apiWorker
     * @param {State} state
     * @returns {User}
     */
    const factory = function (storage, $q, $state, defaultSettings, $mdDialog, apiWorker, state) {

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
                 * @type {Object}
                 */
                this.settings = Object.create(null);
                /**
                 * @type {number}
                 */
                this.lastConfirmPassword = null;
                /**
                 * @type {number}
                 */
                this.lastNotificationTimeStamp = null;
                /**
                 * @type {DefaultSettings}
                 * @private
                 */
                this._settings = null;
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
                this.__props = Object.create(null);
                /**
                 * @type {string}
                 * @private
                 */
                this._password = null;
                /**
                 * @type {number}
                 * @private
                 */
                this._changeTimer = null;

                this._setObserve();
            }

            /**
             * @param {string} name
             * @return {Promise}
             */
            getSetting(name) {
                return this.onLogin()
                    .then(() => tsUtils.cloneDeep(this._settings && this._settings.get(name)));
            }

            getSettingByUser(user, name) {
                const settings = defaultSettings.create(user.settings);
                return settings.get(name);
            }

            /**
             * @param {string} name
             * @param {*} value
             */
            setSetting(name, value) {
                this._settings.set(name, value);
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
            onLogin() {
                return this._dfr.promise;
            }

            /**
             * @return {Promise}
             */
            login() {
                if ($state.$current.name !== 'get_started') {
                    $state.go('welcome');
                }
                return this._dfr.promise;
            }

            logout() {
                window.location.reload();
            }

            getSeed() {
                return this.onLogin()
                    .then(() => {
                        if (!this._password) {
                            return $mdDialog.show({
                                clickOutsideToClose: true,
                                escapeToClose: true,
                                multiple: true,
                                preserveScope: true,
                                templateUrl: '/modules/app/templates/enterPassword.html',
                                controller: 'EnterPasswordCtrl as $ctrl'
                            });
                        } else {
                            const data = {
                                encryptionRounds: this._settings.get('encryptionRounds'),
                                encryptedSeed: this.encryptedSeed,
                                password: this._password
                            };
                            return apiWorker.process((WavesApi, data) => {
                                const phrase = WavesApi
                                    .Seed
                                    .decryptSeedPhrase(data.encryptedSeed, data.password, data.encryptionRounds);

                                return WavesApi.Seed.fromExistingPhrase(phrase);
                            }, data);
                        }
                    });
            }

            /**
             * @param {Object} data
             * @param {string} data.address
             * @param {string} data.encryptedSeed
             * @param {string} data.password
             * @returns Promise
             */
            addUserData(data) {
                this._loadUserByAddress(data.address)
                    .then((item) => {
                        tsUtils.merge(this, item, data);
                        this.lastLogin = Date.now();
                        if (this._settings) {
                            this._settings.change.off();
                        }
                        this._settings = defaultSettings.create(this.settings);
                        this._settings.change.on(() => this._onChangeSettings());

                        if (!this._settings.get('confirmPassword')) {
                            this._password = data.password;
                        }

                        return this._save()
                            .then(() => {

                                state.setMaxSleep(this._settings.get('logoutAfterMin'));
                                this.receive(state.signals.sleep, (min) => {
                                    if (min >= this._settings.get('logoutAfterMin')) {
                                        this.logout();
                                    }
                                });

                                this._dfr.resolve();
                            });
                    });
            }

            /**
             * @returns {Promise}
             */
            getUserList() {
                return storage.load('userList')
                    .then((list) => {
                        list = list || [];

                        list.sort((a, b) => {
                            return a.lastLogin - b.lastLogin;
                        })
                            .reverse();

                        return list;
                    });
            }

            /**
             * @private
             */
            _onChangeSettings() {
                this.settings = { ...this._settings.getSettings() };
            }

            /**
             * @private
             */
            _onChangePropsForSave() {
                if (!this._changeTimer) {
                    this._changeTimer = setTimeout(() => {
                        this._save()
                            .then(() => {
                                this._changeTimer = null;
                            });
                    }, 500);
                }
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
                this.__props[key] = target[key];
                Object.defineProperty(target, key, {
                    get: () => this.__props[key],
                    set: (value) => {
                        if (value !== this.__props[key]) {
                            this.__props[key] = value;
                            this._onChangePropsForSave();
                        }
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
                return storage.load('userList')
                    .then((list) => {
                        list = list || [];
                        list = list.filter(tsUtils.notContains({ address: this.address }));
                        list.push(this._getPublicProps());
                        return storage.save('userList', list);
                    });
            }

            _loadUserByAddress(address) {
                return storage.load('userList')
                    .then((list) => {
                        return tsUtils.find(list || [], { address }) || Object.create(null);
                    });
            }

            /**
             * @return {*}
             * @private
             */
            _getPublicProps() {
                return Object.keys(this)
                    .reduce((result, item) => {
                        if (item.charAt(0) !== '_' && this[item]) {
                            result[item] = this[item];
                        }
                        return result;
                    }, Object.create(null));
            }

        }

        /**
         * @access protected
         * @type {*|<T, R>(signal: Signal<T>, handler: Signal.IHandler<T, R>, context?: R) => void}
         */
        User.prototype.receive = tsUtils.Receiver.prototype.receive;
        /**
         * @access protected
         * @type {*|<T, R>(signal: Signal<T>, handler: Signal.IHandler<T, R>, context?: R) => void}
         */
        User.prototype.receiveOnce = tsUtils.Receiver.prototype.receiveOnce;
        /**
         * @access protected
         * @type {*|((item?: TStopArg1, handler?: Signal.IHandler<any, any>) => void)}
         */
        User.prototype.stopReceive = tsUtils.Receiver.prototype.stopReceive;

        return new User();
    };

    factory.$inject = ['storage', '$q', '$state', 'defaultSettings', '$mdDialog', 'apiWorker', 'state'];

    angular.module('app')
        .factory('user', factory);
})();

/**
 * @typedef {Object} IUserSettings
 * @property {Array<string>} assets
 */
