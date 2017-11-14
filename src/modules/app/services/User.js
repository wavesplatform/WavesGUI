(function () {
    'use strict';

    /**
     * @param {Storage} storage
     * @param {$q} $q
     * @param {*} $state
     * @param {app.defaultSettings} defaultSettings
     * @param {app.utils.apiWorker} apiWorker
     * @param {State} state
     * @param {UserRouteState} UserRouteState
     * @param {ModalManager} modalManager
     * @param {TimeLine} timeLine
     * @return {User}
     */
    const factory = function (storage, $q, $state, defaultSettings, apiWorker, state, UserRouteState, modalManager, timeLine) {

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
                /**
                 * @type {Array}
                 * @private
                 */
                this._stateList = null;
                /**
                 * @type {Array}
                 * @private
                 */
                this._fieldsForSave = [];

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
             * @return {Promise}
             */
            onLogin() {
                return this._dfr.promise;
            }

            /**
             * @return {Promise}
             */
            login() {
                const states = WavesApp.stateTree.where({ noLogin: true })
                    .map((item) => {
                        return WavesApp.stateTree.getPath(item.id)
                            .join('.');
                    });
                if (states.indexOf($state.$current.name) === -1) {
                    $state.go(states[0]);
                }
                return this._dfr.promise;
            }

            logout() {
                window.location.reload();
            }

            getActiveState(name) {
                const userState = tsUtils.find(this._stateList || [], { name });
                if (userState) {
                    return userState.state;
                } else {
                    return WavesApp.stateTree.getPath(name)
                        .join('.');
                }
            }

            applyState(state) {
                if (this._stateList) {
                    this._stateList.some((item) => item.applyState(state, this));
                }
            }

            getSeed() {
                return this.onLogin()
                    .then(() => {
                        if (!this._password) {
                            return modalManager.getSeed();
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
             * @param {Object} [data.settings]
             * @param {boolean} [data.settings.termsAccepted]
             * @return Promise
             */
            addUserData(data) {
                this._loadUserByAddress(data.address)
                    .then((item) => {
                        this._fieldsForSave.forEach((propertyName) => {
                            if (data[propertyName] != null) {
                                this[propertyName] = data[propertyName];
                            } else if (item[propertyName] != null) {
                                this[propertyName] = item[propertyName];
                            }
                        });
                        this.lastLogin = Date.now();
                        if (this._settings) {
                            this._settings.change.off();
                        }
                        this._settings = defaultSettings.create(this.settings);
                        this._settings.change.on(() => this._onChangeSettings());

                        if (this._settings.get('savePassword')) {
                            this._password = data.password;
                        }

                        const states = WavesApp.stateTree.find('main')
                            .getChildren();
                        this._stateList = states.map((baseTree) => {
                            const id = baseTree.id;
                            return new UserRouteState('main', id, this._settings.get(`${id}.activeState`));
                        });

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
             * @return {Promise}
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
                    this._changeTimer = timeLine.timeout(() => {
                        this._changeTimer = null;
                        this._save();
                    }, 500);
                }
            }

            /**
             * @private
             */
            _setObserve() {
                this._fieldsForSave = Object.keys(this)
                    .filter((property) => property.charAt(0) !== '_');
                this._fieldsForSave.forEach((key) => {
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
             * @return {Promise}
             * @private
             */
            _save() {
                return storage.load('userList')
                    .then((list) => {
                        list = list || [];
                        list = list.filter(tsUtils.notContains({ address: this.address }));
                        const props = this._fieldsForSave.reduce((result, propertyName) => {
                            const property = this[propertyName];
                            if (property != null) {
                                result[propertyName] = property;
                            }
                            return result;
                        }, Object.create(null));
                        list.push(props);
                        return storage.save('userList', list);
                    });
            }

            _loadUserByAddress(address) {
                return storage.load('userList')
                    .then((list) => {
                        return tsUtils.find(list || [], { address }) || Object.create(null);
                    });
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

    factory.$inject = [
        'storage',
        '$q',
        '$state',
        'defaultSettings',
        'apiWorker',
        'state',
        'UserRouteState',
        'modalManager',
        'timeLine'
    ];

    angular.module('app')
        .factory('user', factory);
})();

/**
 * @typedef {Object} IUserSettings
 * @property {Array<string>} assets
 */
