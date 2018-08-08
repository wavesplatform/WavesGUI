/* global transfer */
(function () {
    'use strict';

    /* global
        Mousetrap
     */

    const NOT_SYNC_FIELDS = [
        'changeSetting'
    ];

    /**
     * @param {Storage} storage
     * @param {*} $state
     * @param {app.defaultSettings} defaultSettings
     * @param {State} state
     * @param {UserRouteState} UserRouteState
     * @param {ModalManager} modalManager
     * @param {TimeLine} timeLine
     * @return {User}
     */
    const factory = function (storage, $state, defaultSettings, state, UserRouteState, modalManager, timeLine, themes) {

        const tsUtils = require('ts-utils');

        class User {


            /**
             * @type {Signal<string>} setting path
             */
            get changeSetting() {
                return this._settings.change;
            }

            constructor() {
                /**
                 * @type {string}
                 */
                this.address = null;
                /**
                 * @type {string}
                 */
                this.id = null;
                /**
                 * @type {string}
                 */
                this.name = null;
                /**
                 * @type {string}
                 */
                this.publicKey = null;
                /**
                 * @type {string}
                 */
                this.encryptedSeed = null;
                /**
                 * @type {string}
                 */
                this.userType = null;
                /**
                 * @type {string}
                 */
                this.userType = null;
                /**
                 * @type {object}
                 */
                this.settings = Object.create(null);
                /**
                 * @type {boolean}
                 */
                this.noSaveToStorage = false;
                /**
                 * @type {DefaultSettings}
                 * @private
                 */
                this._settings = defaultSettings.create(Object.create(null));
                /**
                 * @type {number}
                 */
                this.lastLogin = Date.now();

                this.matcherSign = null;

                /**
                 * @type {Deferred}
                 * @private
                 */
                this._dfr = $.Deferred();
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
                this._history = [];

                this._setObserve();
                this._settings.change.on(() => this._onChangeSettings());

                Mousetrap.bind(['ctrl+shift+k'], () => this.switchNextTheme());
            }

            /**
             * @return {boolean}
             */
            isMaster() {
                return !!this._password;
            }

            /**
             * @param {string} name
             * @return {*}
             */
            getSetting(name) {
                return this._settings.get(name);
            }

            /**
             * @param {string} assetId
             * @param {boolean} [state]
             */
            togglePinAsset(assetId, state) {
                this.toggleArrayUserSetting('pinnedAssetIdList', assetId, state);
                if (this.hasInArrayUserSetting('pinnedAssetIdList', assetId)) {
                    this.toggleSpamAsset(assetId, false);
                }
            }

            /**
             * @param {string} assetId
             * @param {boolean} [state]
             */
            toggleSpamAsset(assetId, state) {
                this.toggleArrayUserSetting('wallet.portfolio.spam', assetId, state);
                if (this.hasInArrayUserSetting('wallet.portfolio.spam', assetId)) {
                    this.togglePinAsset(assetId, false);
                }
            }

            /**
             * @param {string} path
             * @param {string|number} value
             * @param {boolean} [state]
             * @return {null}
             */
            toggleArrayUserSetting(path, value, state) {
                const list = this.getSetting(path);
                const index = list.indexOf(value);
                state = tsUtils.isEmpty(state) ? index === -1 : state;

                if (state && index === -1) {
                    const newList = list.slice();
                    newList.push(value);
                    this.setSetting(path, newList);
                    return null;
                }

                if (!state && index !== -1) {
                    const newList = list.slice();
                    newList.splice(index, 1);
                    this.setSetting(path, newList);
                    return null;
                }
            }

            /**
             * @param {string} path
             * @param {string} value
             * @return {boolean}
             */
            hasInArrayUserSetting(path, value) {
                const list = this.getSetting(path);
                return list.includes(value);
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

            getDefaultUserSettings(settings) {
                return defaultSettings.create({ ...settings });
            }

            /**
             * @param {User} user
             * @param {string} name
             * @return {DefaultSettings}
             */
            getSettingsByUser(user) {
                const settings = this.getDefaultUserSettings(user.settings);
                return settings;
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
                return this._dfr.promise();
            }

            /**
             * @param {object} data
             * @param {string} data.address
             * @param {string} data.password
             * @return {Promise}
             *
             */
            login(data) {
                return this._addUserData(data)
                    .then(() => analytics.push('User', `Login.${WavesApp.type}`));
            }

            /**
             * @param {object} data
             * @param {string} data.address
             * @param {string} data.name
             * @param {string} data.encryptedSeed
             * @param {string} data.publicKey
             * @param {string} data.password
             * @param {string} data.userType
             * @param {boolean} data.saveToStorage
             * @param {boolean} hasBackup
             * @return Promise
             */
            create(data, hasBackup, restore) {

                this.noSaveToStorage = !data.saveToStorage;

                return this._addUserData({
                    id: data.id,
                    api: data.api,
                    address: data.address,
                    password: data.password,
                    name: data.name,
                    userType: data.userType,
                    encryptedSeed: data.encryptedSeed,
                    publicKey: data.publicKey,
                    settings: {
                        termsAccepted: false,
                        hasBackup: hasBackup,
                        lng: i18next.language,
                        theme: themes.getDefaultTheme(),
                        candle: 'blue'
                    }
                }).then(() => analytics.push(
                    'User',
                    `${restore ? 'Restore' : 'Create'}.${WavesApp.type}`,
                    document.referrer)
                );
            }

            logout() {
                if (WavesApp.isDesktop()) {
                    transfer('reload');
                } else {
                    window.location.reload();
                }
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
                this._history.push(state.name);
                this._history = this._history.slice(-10);
                if (this._stateList) {
                    this._stateList.some((item) => item.applyState(state, this));
                }
            }

            getLastState() {
                return this._history.length > 1 ? this._history[this._history.length - 2] : 'welcome';
            }

            /**
             * @return {Promise}
             */
            getUserList() {
                return storage.onReady().then(() => storage.load('userList'))
                    .then((list) => {
                        list = list || [];

                        list.sort((a, b) => {
                            return a.lastLogin - b.lastLogin;
                        })
                            .reverse();

                        return list;
                    });
            }

            removeUserByAddress(removeAddress) {
                return storage.load('userList')
                    .then((list) => list.filter(({ address }) => address !== removeAddress))
                    .then((list) => storage.save('userList', list));
            }

            getThemeSettings() {
                const currentTheme = this.getSetting('theme');
                return themes.getSettings(currentTheme);
            }

            changeTheme(theme) {
                const currentTheme = this.getSetting('theme');
                const newTheme = themes.changeTheme(theme || this.getSetting('theme'));
                if (currentTheme !== newTheme) {
                    this.setSetting('theme', newTheme);
                }
                analytics.push('Settings', 'Settings.ChangeTheme', newTheme);
            }

            changeCandle(name) {
                const currentTheme = this.getSetting('theme');
                const current = this.getSetting('candle');
                themes.setCandleColorsByName(currentTheme, name);
                if (name !== current) {
                    this.setSetting('candle', name);
                }
            }

            switchNextTheme() {
                const newTheme = themes.switchNext();
                this.setSetting('theme', newTheme);
            }

            /**
             * @param {object} data
             * @param {ISignatureApi} data.api
             * @param {string} data.address
             * @param {string} data.userType
             * @param {string} [data.encryptedSeed]
             * @param {string} [data.publicKey]
             * @param {string} data.password
             * @param {string} data.userType
             * @param {object} [data.settings]
             * @param {boolean} [data.settings.termsAccepted]
             * @return Promise
             * @private
             */
            _addUserData(data) {
                return this._loadUserByAddress(data.address)
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

                        Object.keys(WavesApp.network).forEach((key) => {
                            ds.config.set(key, this._settings.get(`network.${key}`));
                        });

                        ds.app.login(data.address, data.api);
                        this.addMatcherSign().then((matcherSign) => {
                            this.matcherSign = matcherSign || this.matcherSign || { timestamp: 0, signature: '' };
                            return ds.app.addMatcherSign(this.matcherSign.timestamp, this.matcherSign.signature);
                        }).then(() => {
                            this.changeTheme();
                            this.changeCandle();
                            return this._save();
                        }).then(() => {
                            this._logoutTimer();
                            this._dfr.resolve();
                        });
                    });
            }

            /**
             * @return {Promise<{signature, timestamp}>}
             */
            addMatcherSign() {
                let promise;
                let modalPromise;

                const dayForwardTime = ds.app.getTimeStamp(1, 'day');
                if (!this.matcherSign || this.matcherSign.timestamp - dayForwardTime < 0) {
                    const maxIntervalTimeStamp = ds.app.getTimeStamp(
                        WavesApp.matcherSignInterval.count,
                        WavesApp.matcherSignInterval.timeType
                    );
                    promise = ds.app.signForMatcher(maxIntervalTimeStamp).then(
                        (signature) => {
                            return { signature, timestamp: maxIntervalTimeStamp };
                        });

                    if (this.userType && this.userType === 'ledger') {
                        modalPromise = ds.app.getSignIdForMatcher(maxIntervalTimeStamp).then((id) => {
                            return modalManager.showSignLedger({ promise, mode: 'sign-matcher', id });
                        });

                        return Promise.all([promise, modalPromise]).catch(
                            () => modalManager.showLedgerError({ error: 'sign-error' }).then(
                                () => {
                                    return this.addMatcherSign();
                                },
                                () => {
                                    // No matcher sign, may be other modal
                                    Promise.resolve();
                                }
                            ));
                    }

                    return promise;
                }

                return Promise.resolve(this.matcherSign);
            }

            /**
             * @private
             */
            _logoutTimer() {
                this.receive(state.signals.sleep, (min) => {
                    if (min >= this._settings.get('logoutAfterMin')) {
                        this.logout();
                    }
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
             * @return {Promise}
             * @private
             */
            _save() {
                if (this.noSaveToStorage || !this.address) {
                    return Promise.resolve();
                }

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
        '$state',
        'defaultSettings',
        'state',
        'UserRouteState',
        'modalManager',
        'timeLine',
        'themes'
    ];

    angular.module('app').factory('user', factory);
})();

/**
 * @typedef {object} IUserSettings
 * @property {Array<string>} assets
 */
