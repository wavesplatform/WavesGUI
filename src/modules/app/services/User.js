(function () {
    'use strict';

    const NOT_SYNC_FIELDS = [
        'changeSetting'
    ];

    /**
     * @param {Storage} storage
     * @param {$q} $q
     * @param {*} $state
     * @param {app.defaultSettings} defaultSettings
     * @param {State} state
     * @param {UserRouteState} UserRouteState
     * @param {ModalManager} modalManager
     * @param {TimeLine} timeLine
     * @return {User}
     */
    const factory = function (storage, $q, $state, defaultSettings, state, UserRouteState, modalManager, timeLine) {

        class User {

            constructor() {
                /**
                 * @type {string}
                 */
                this.address = null;
                /**
                 * @type {Signal}
                 */
                this.changeSetting = null;
                /**
                 * @type {string}
                 */
                this.publicKey = null;
                /**
                 * @type {string}
                 */
                this.encryptedSeed = null;
                /**
                 * @type {object}
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
                 * @type {object}
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
             * @return {*}
             */
            getSetting(name) {
                return this._settings.get(name);
            }

            /**
             * @param {User} user
             * @param {string} name
             * @return {*}
             */
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
             * @param {object} data
             * @param {string} data.address
             * @param {string} data.password
             * @return {Promise}
             *
             */
            login(data) {
                return this._addUserData(data);
            }

            /**
             * @param {object} data
             * @param {string} data.address
             * @param {string} data.encryptedSeed
             * @param {string} data.publicKey
             * @param {string} data.password
             * @param {boolean} hasBackup
             * @return Promise
             */
            create(data, hasBackup) {
                return this._addUserData({
                    address: data.address,
                    password: data.password,
                    encryptedSeed: data.encryptedSeed,
                    publicKey: data.publicKey,
                    settings: {
                        termsAccepted: false,
                        hasBackup: hasBackup
                    }
                });
            }

            logout() {
                window.location.reload();
            }

            /**
             * Get active state from children of state "name"
             * @param {string} name     Name of state
             * @return {string}
             */
            getActiveState(name) {
                const userState = tsUtils.find(this._stateList || [], { name });
                if (userState) {
                    return userState.state;
                } else {
                    return WavesApp.stateTree.getPath(name)
                        .join('.');
                }
            }

            /**
             * Apply active state for children of state with name {{state}}
             * @param {string} state    state name
             */
            applyState(state) {
                if (this._stateList) {
                    this._stateList.some((item) => item.applyState(state, this));
                }
            }

            /**
             * @return {Promise<Seed>}
             */
            getSeed() {
                return this.onLogin() // TODO Refactor. Author Tsigel at 22/11/2017 09:35
                    .then(() => {
                        if (!this._password) {
                            return modalManager.getSeed();
                        } else {

                            const encryptionRounds = this._settings.get('encryptionRounds');
                            const encryptedSeed = this.encryptedSeed;
                            const password = this._password;

                            const phrase = Waves.Seed.decryptSeedPhrase(encryptedSeed, password, encryptionRounds);
                            return Waves.Seed.fromExistingPhrase(phrase);
                        }
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
             * @param {object} data
             * @param {string} data.address
             * @param {string} [data.encryptedSeed]
             * @param {string} [data.publicKey]
             * @param {string} data.password
             * @param {object} [data.settings]
             * @param {boolean} [data.settings.termsAccepted]
             * @return Promise
             * @private
             */
            _addUserData(data) {
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
                        this.changeSetting = this._settings.change;

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
                    .filter((property) => property.charAt(0) !== '_' && NOT_SYNC_FIELDS.indexOf(property) === -1);
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
                    // TODO Need _addUserData!
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
        'state',
        'UserRouteState',
        'modalManager',
        'timeLine'
    ];

    angular.module('app').factory('user', factory);
})();

/**
 * @typedef {object} IUserSettings
 * @property {Array<string>} assets
 */
