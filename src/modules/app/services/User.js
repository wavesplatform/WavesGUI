/* global transfer */
(function () {
    'use strict';

    const { equals } = require('ramda');
    const { utils: generatorUtils } = require('@waves/signature-generator');

    /* global
        Mousetrap
     */

    const NOT_SYNC_FIELDS = [
        'changeSetting',
        'extraFee',
        'networkError',
        'changeScript',
        'setScamSignal',
        'scam',
        'onLogout'
    ];

    /**
     * @param {Storage} storage
     * @param {*} $state
     * @param {app.defaultSettings} defaultSettings
     * @param {State} state
     * @param {UserRouteState} UserRouteState
     * @param {ModalManager} modalManager
     * @param {TimeLine} timeLine
     * @param {$injector} $injector
     * @param {app.utils} utils
     * @param {*} themes
     * @return {User}
     */
    const factory = function (storage,
                              $state,
                              defaultSettings,
                              state,
                              UserRouteState,
                              modalManager,
                              timeLine,
                              $injector,
                              utils,
                              themes) {

        const tsUtils = require('ts-utils');
        const ds = require('data-service');
        const { Money } = require('@waves/data-entities');
        const analytics = require('@waves/event-sender');

        /**
         * @class User
         */
        class User {

            /**
             * @type {Signal<string>} setting path
             */
            get changeSetting() {
                return this._settings.change;
            }

            /**
             * @type {Signal<{}>}
             */
            onLogout = new tsUtils.Signal();
            /**
             * @type {boolean}
             */
            networkError = false;
            /**
             * @type {string}
             */
            address = null;
            /**
             * @type {string}
             */
            id = null;
            /**
             * @type {string}
             */
            name = null;
            /**
             * @type {string}
             */
            publicKey = null;
            /**
             * @type {string}
             */
            encryptedSeed = null;
            /**
             * @type {string}
             */
            userType = null;
            /**
             * @type {object}
             */
            settings = Object.create(null);
            /**
             * @type {number}
             */
            lastLogin = Date.now();
            /**
             * @type {{signature: string, timestamp: number}}
             */
            matcherSign = null;
            /**
             * @type {Money}
             */
            extraFee = null;
            /**
             * @type {Signal<void>}
             */
            changeScript = new tsUtils.Signal();
            /**
             * @type {Signal<void>}
             */
            setScamSignal = new tsUtils.Signal();
            /**
             * @type {Record<string, boolean>}
             */
            scam = Object.create(null);
            /**
             * @type {DefaultSettings}
             * @private
             */
            _settings = defaultSettings.create(Object.create(null));
            /**
             * @type {Deferred}
             * @private
             */
            _dfr = $.Deferred();
            /**
             * @type {object}
             * @private
             */
            __props = Object.create(null);
            /**
             * @type {string}
             * @private
             */
            _password = null;
            /**
             * @type {number}
             * @private
             */
            _changeTimer = null;
            /**
             * @type {Array}
             * @private
             */
            _stateList = null;
            /**
             * @type {Array}
             * @private
             */
            _fieldsForSave = [];
            /**
             * @type {Array}
             * @private
             */
            _history = [];
            /**
             * @type {boolean}
             * @private
             */
            _hasScript = false;
            /**
             * @type {Poll}
             * @private
             */
            _scriptInfoPoll = null;
            /**
             * @type {boolean}
             * @private
             */
            _noSaveToStorage = false;

            constructor() {

                this._setObserve();
                this._settings.change.on(() => this._onChangeSettings());

                Mousetrap.bind(['ctrl+shift+k'], () => this.switchNextTheme());

                this.onLogin().then(() => {
                    /**
                     * @type {Poll}
                     */
                    const Poll = $injector.get('Poll');
                    setTimeout(() => {
                        this._scriptInfoPoll = new Poll(() => this.updateScriptAccountData(), () => null, 10000);
                    }, 30000);

                });

            }

            setScam(hash) {
                if (!equals(hash, this.scam)) {
                    this.scam = hash;
                    this.setScamSignal.dispatch();
                }
            }

            /**
             * @return {boolean}
             */
            hasScript() {
                return this._hasScript;
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
                this.networkError = false;
                return this._addUserData(data)
                    .then(() => analytics.send({ name: 'Sign In Success' }));
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
                this._noSaveToStorage = !data.saveToStorage;

                data.userType = data.userType || 'seed';

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
                        hasBackup,
                        lng: i18next.language,
                        theme: themes.getDefaultTheme(),
                        candle: 'blue',
                        dontShowSpam: true
                    }
                }).then(() => {
                    if (restore) {
                        analytics.send({
                            name: 'Import Backup Success',
                            params: { userType: data.userType }
                        });
                    } else {
                        analytics.send({
                            name: 'Create Success',
                            params: {
                                hasBackup,
                                userType: data.userType
                            }
                        });
                    }
                });
            }

            /**
             * @param {string} [stateName]
             */
            logout(stateName) {
                this.onLogout.dispatch({});

                const applyLogout = () => { // TODO DEXW-1740
                    if (WavesApp.isDesktop()) {
                        transfer('reload');
                    } else {
                        window.location.reload();
                    }
                };

                if (stateName) { // TODO DEXW-1740
                    state.signals.changeRouterStateSuccess.once(
                        () => requestAnimationFrame(applyLogout)
                    );
                    $state.go(stateName, { logout: true });
                } else {
                    applyLogout();
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
                    .then(list => {
                        list = list || [];

                        list.sort((a, b) => {
                            return a.lastLogin - b.lastLogin;
                        })
                            .reverse();

                        return list;
                    });
            }

            /**
             * @return {Promise}
             */
            getFilteredUserList() {
                return this.getUserList()
                    .then(list => list.filter(user => generatorUtils.crypto.isValidAddress(user.address)));
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
                // analytics.push('Settings', 'Settings.ChangeTheme', newTheme);
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
             * @return {Promise<any>}
             */
            async updateScriptAccountData(item = null) {
                let waves;
                const address = item ? item.address : this.address;
                try {
                    this.networkError = false;
                    waves = await ds.api.assets.get(WavesApp.defaultAssets.WAVES);
                } catch (e) {
                    this.networkError = true;
                    throw new Error('Can\'t get Waves asset');
                }

                const addHasScript = value => {
                    if (this._hasScript !== value) {
                        this._hasScript = value;
                        this.changeScript.dispatch();
                    }
                };

                try {
                    const response = await ds.fetch(`${ds.config.get('node')}/addresses/scriptInfo/${address}`);
                    this.extraFee = Money.fromCoins(response.extraFee, waves);
                    addHasScript(response.extraFee !== 0);
                } catch (e) {
                    addHasScript(!!this._hasScript);
                    this.extraFee = this.extraFee || Money.fromCoins(0, waves);
                }
            }

            /**
             * @return {Promise<{signature, timestamp}>}
             */
            addMatcherSign() {
                /**
                 * @type {Promise<{signature: string, timestamp: number}>}
                 */
                const promise = utils.signUserOrders({ matcherSign: this.matcherSign });

                promise.then(matcherSign => {
                    this.matcherSign = matcherSign;
                    ds.app.addMatcherSign(matcherSign.timestamp, matcherSign.signature);
                });

                return promise;
            }

            /**
             * @public
             * @return {Promise<string>}
             */
            async getDefaultUserName() {
                const defaultNameRegexps = [/^Account\s\d+\s*$/, /^Account\s*$/];
                const accoutString = 'Account';
                const list = await this.getFilteredUserList();

                if (!list.length) {
                    return accoutString;
                }

                const accountCounters = list
                    .map(user => user.name)
                    .filter(name => defaultNameRegexps.some(defaultName => defaultName.test(name)))
                    .map(name => +name.substring(accoutString.length + 1));

                if (!accountCounters.length) {
                    return accoutString;
                }

                const counter = Math.max(...accountCounters);
                return counter ? `${accoutString} ${counter + 1}` : `${accoutString} ${counter + 2}`;
            }

            /**
             * @param {object} data
             * @param {Adapter} data.api
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
                return data.api.getPublicKey().then(publicKey => (data.publicKey = publicKey))
                    .then(() => this._loadUserByAddress(data.address))
                    .then((item) => {
                        this._fieldsForSave.forEach((propertyName) => {
                            if (data[propertyName] != null) {
                                this[propertyName] = data[propertyName];
                            } else if (item[propertyName] != null) {
                                this[propertyName] = item[propertyName];
                            }
                        });

                        analytics.addDefaultParams({ userType: this.userType });
                        this.lastLogin = Date.now();

                        if (this._settings) {
                            this._settings.change.off();
                        }

                        this._settings = defaultSettings.create(this.settings);
                        this._settings.change.on(() => this._onChangeSettings());

                        if (this._settings.get('savePassword')) {
                            this._password = data.password;
                        }

                        const states = WavesApp.stateTree.find('main').getChildren();
                        this._stateList = states.map((baseTree) => {
                            const id = baseTree.id;
                            return new UserRouteState('main', id, this._settings.get(`${id}.activeState`));
                        });

                        Object.keys(WavesApp.network).forEach((key) => {
                            ds.config.set(key, this._settings.get(`network.${key}`));
                        });

                        ds.config.set('oracleWaves', this.getSetting('oracleWaves'));

                        ds.app.login(data.address, data.api);

                        data.api.onDestroy(() => {
                            this.logout();
                        });

                        return this.addMatcherSign()
                            .catch(() => Promise.resolve())
                            .then(() => {
                                this.changeTheme();
                                this.changeCandle();
                                return this._save();
                            })
                            .then(() => this._logoutTimer())
                            .then(() => this.updateScriptAccountData())
                            .then(this._dfr.resolve)
                            .catch((e) => {
                                ds.app.logOut();
                                return Promise.reject(e);
                            });
                    });
            }

            /**
             * @private
             */
            _logoutTimer() {
                this.receive(state.signals.sleep, min => {
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
                if (this._noSaveToStorage || !this.address) {
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
        '$injector',
        'utils',
        'themes'
    ];

    angular.module('app').factory('user', factory);
})();

/**
 * @typedef {object} IUserSettings
 * @property {Array<string>} assets
 */
