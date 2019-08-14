/* global transfer Mousetrap WavesApp: readonly */
(function () {
    'use strict';

    const { equals } = require('ramda');
    const { isValidAddress } = require('@waves/signature-adapter');

    const NOT_SYNC_FIELDS = [
        'changeSetting',
        'isAuthorised',
        'extraFee',
        'networkError',
        'changeScript',
        'setScamSignal',
        'scam',
        'loginSignal',
        'logoutSignal',
        'setTokensNameSignal',
        'tokensName'
    ];

    /**
     * @param {Storage} storage
     * @param {*} $state
     * @param {app.defaultSettings} defaultSettings
     * @param {State} state
     * @param {ng.auto.IInjectorService} $injector
     * @param {UserRouteState} UserRouteState
     * @param {Poll} Poll
     * @param {TimeLine} timeLine
     * @param {app.utils} utils
     * @param {*} themes
     * @param {MultiAccount} multiAccount
     * @return {User}
     */
    const factory = function (
        storage,
        $state,
        $injector,
        defaultSettings,
        state,
        UserRouteState,
        Poll,
        timeLine,
        utils,
        themes,
        multiAccount
    ) {

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
             * @type {boolean}
             */
            get isAuthorised() {
                return !!this.address;
            }

            /**
             * @type {Signal<{}>}
             */
            loginSignal = new tsUtils.Signal();
            /**
             * @type {Signal<{}>}
             */
            logoutSignal = new tsUtils.Signal();
            /**
             * @type {boolean}
             */
            networkError;
            /**
             * @type {string}
             */
            address;
            /**
             * @type {string}
             */
            id;
            /**
             * @type {string}
             */
            name;
            /**
             * @type {string}
             */
            publicKey;
            /**
             * @type {string}
             */
            encryptedSeed;
            /**
             * @type {string}
             */
            encryptedPrivateKey;
            /**
             * @type {string}
             */
            userType;
            /**
             * @type {object}
             */
            settings;
            /**
             * @type {number}
             */
            lastLogin;
            /**
             * @type {{signature: string, timestamp: number}}
             */
            matcherSign;
            /**
             * @type {Money}
             */
            extraFee;
            /**
             * @type {Signal<void>}
             */
            changeScript;
            /**
             * @type {Signal<void>}
             */
            setScamSignal;
            /**
             * @type {Signal<void>}
             */
            setTokensNameSignal = new tsUtils.Signal();
            /**
             * @type {Record<string, boolean>}
             */
            scam;
            /**
             * @type {Record<string, boolean>}
             */
            tokensName = Object.create(null);
            /**
             * @type {DefaultSettings}
             * @private
             */
            _settings;
            /**
             * @type {object}
             * @private
             */
            __props;
            /**
             * @type {string}
             * @private
             */
            _password;
            /**
             * @type {number}
             * @private
             */
            _changeTimer;
            /**
             * @type {Array}
             * @private
             */
            _stateList;
            /**
             * @type {Array}
             * @private
             */
            _fieldsForSave = [];
            /**
             * @type {Array}
             * @private
             */
            _history;
            /**
             * @type {boolean}
             * @private
             */
            _hasScript;
            /**
             * @type {Poll}
             * @private
             */
            _scriptInfoPoll;
            /**
             * @type {number}
             */
            _scriptInfoPollTimeoutId;
            /**
             * @type {boolean}
             * @private
             */
            _noSaveToStorage;

            constructor() {
                this._resetFields();
                this._setObserve();
                this._settings.change.on(() => this._onChangeSettings());

                Mousetrap.bind(['ctrl+shift+k'], () => this.switchNextTheme());
            }

            setScam(hash) {
                if (!equals(hash, this.scam)) {
                    this.scam = hash;
                    this.setScamSignal.dispatch();
                }
            }

            setTokensNameList(hash) {
                if (!equals(hash, this.tokensName)) {
                    this.tokensName = hash;
                    this.setTokensNameSignal.dispatch();
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
             * @return {DefaultSettings}
             */
            getSettingsByUser(user) {
                return this.getDefaultUserSettings(user.settings);
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
            getMultiAccountData() {
                return storage.load('multiAccountData');
            }

            /**
             * @return {Promise}
             */
            getMultiAccountHash() {
                return storage.load('multiAccountHash');
            }

            /**
             * @return {Promise}
             */
            getMultiAccountUsers() {
                return storage.load('multiAccountUsers').then(users => {
                    return multiAccount.toList(users)
                        .filter(user => this.isValidAddress(user.address));
                });
            }

            /**
             * @return {Promise}
             */
            saveMultiAccount(data) {
                return Promise.all([
                    storage.save('multiAccountData', data.multiAccountData),
                    storage.save('multiAccountHash', data.multiAccountHash)
                ]);
            }

            /**
             * @return {Promise}
             */
            migrateUser(userToMigrate, userHash) {
                // TODO map user settings to a new schema
                const user = {
                    userType: userToMigrate.userType,
                    name: userToMigrate.name,
                    lastLogin: userToMigrate.lastLogin,
                    matcherSign: userToMigrate.matcherSign,
                    settings: userToMigrate.settings
                };

                return this.addMultiAccountUser(user, userHash)
                    .then(() => this.removeUserByAddress(userToMigrate.address));
            }

            /**
             * @return {Promise}
             */
            addMultiAccountUser(user, userHash) {
                return storage.load('multiAccountUsers')
                    .then(users => this.saveMultiAccountUsers({
                        ...users,
                        [userHash]: user
                    }));
            }

            /**
             * @return {Promise}
             */
            saveMultiAccountUsers(users) {
                return storage.save('multiAccountUsers', users);
            }

            /**
             * @return {Promise}
             */
            onLogin() {
                if (this.isAuthorised) {
                    return Promise.resolve();
                } else {
                    return new Promise((resolve, reject) => {
                        this.loginSignal.once(resolve);
                        this.logoutSignal.once(reject);
                    });
                }
            }

            initScriptInfoPolling() {
                clearTimeout(this._scriptInfoPollTimeoutId);
                this._scriptInfoPollTimeoutId = setTimeout(() => {
                    if (this._scriptInfoPoll) {
                        this._scriptInfoPoll.destroy();
                    }
                    this._scriptInfoPoll = new Poll(() => this.updateScriptAccountData(), () => null, 10000);
                }, 30000);
            }

            /**
             * @param {object} userData
             * @returns {Promise}
             */
            login(userData) {
                this.networkError = false;

                return multiAccount.getAdapter(userData.hash).then(adapter => {
                    const adapterAvailablePromise = adapter.isAvailable(true);
                    const modalManager = $injector.get('modalManager');
                    let canLoginPromise;

                    if (this._isSeedAdapter(adapter) || this._isPrivateKeyAdapter(api)) {
                        canLoginPromise = adapterAvailablePromise.then(() => adapter.getAddress())
                            .then(address => address === userData.address || Promise.reject('Wrong address!'));
                    } else {
                        canLoginPromise = modalManager.showLoginByDevice(adapterAvailablePromise, adapter.type);
                    }

                    return canLoginPromise.then(() => {
                        return this._addUserData(userData, adapter).then(() => {
                            this.initScriptInfoPolling();
                            analytics.send({ name: 'Sign In Success' });
                        });
                    }, () => {
                        if (!this._isSeedAdapter(adapter) || this._isPrivateKeyAdapter(api)) {
                            const errorData = {
                                error: 'load-user-error',
                                userType: adapter.type,
                                address: userData.address
                            };
                            return modalManager.showSignDeviceError(errorData)
                                .catch(() => Promise.resolve());
                        }
                    });
                });
            }

            /**
             * @param {object} data
             * @param {string} data.address
             * @param {string} data.name
             * @param {string} data.id
             * @param {string} data.encryptedSeed
             * @param {string} data.encryptedPrivateKey
             * @param {string} data.publicKey
             * @param {string} data.password
             * @param {string} data.userType
             * @param {string} data.api
             * @param {boolean} data.saveToStorage
             * @param {boolean} hasBackup
             * @param {boolean} restore
             * @return {Promise}
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
                    encryptedPrivateKey: data.encryptedPrivateKey,
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
                    this.initScriptInfoPolling();
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
                if (!this.isAuthorised) {
                    return null;
                }

                ds.app.logOut();
                clearTimeout(this._scriptInfoPollTimeoutId);

                if (this._scriptInfoPoll) {
                    this._scriptInfoPoll.destroy();
                }

                if (stateName) {
                    this.logoutSignal.dispatch({});
                    this._resetFields();
                    this.changeTheme(themes.getDefaultTheme());
                    $state.go(stateName, undefined, { custom: { logout: true } });
                } else if (WavesApp.isDesktop()) {
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
                    return WavesApp.stateTree.getPath(name).join('.');
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

                        list.sort((a, b) => a.lastLogin - b.lastLogin).reverse();

                        return list;
                    });
            }

            /**
             * @param address
             */
            isValidAddress(address) {
                try {
                    return isValidAddress(address, WavesApp.network.code.charCodeAt(0));
                } catch (e) {
                    return false;
                }
            }

            /**
             * @return {Promise}
             */
            getFilteredUserList() {
                return this.getUserList().then(
                    list => list.filter(user => this.isValidAddress(user.address))
                );
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
             * @private
             */
            _resetFields() {
                this.networkError = false;
                this.address = null;
                this.id = null;
                this.name = null;
                this.publicKey = null;
                this.encryptedSeed = null;
                this.encryptedPrivateKey = null;
                this.userType = null;
                this.settings = Object.create(null);
                this.lastLogin = Date.now();
                this.matcherSign = null;
                this.extraFee = null;
                this.changeScript = new tsUtils.Signal();
                this.setScamSignal = new tsUtils.Signal();
                this.scam = Object.create(null);
                this._settings = defaultSettings.create(Object.create(null));
                this.__props = Object.create(null);
                this._password = null;
                this._changeTimer = null;
                this._stateList = null;
                this._history = [];
                this._hasScript = false;
                this._scriptInfoPoll = null;
                this._scriptInfoPollTimeoutId = null;
                this._noSaveToStorage = false;
            }

            /**
             * @param {object} data
             * @param {string} data.address
             * @param {string} data.userType
             * @param {string} [data.encryptedSeed]
             * @param {string} data.publicKey
             * @param {string} data.userType
             * @param {string} data.hash
             * @param {object} [data.settings]
             * @param {boolean} [data.settings.termsAccepted]
             * @param {Adapter} adapter
             * @return {Promise}
             * @private
             */
            _addUserData(data, adapter) {
                this._fieldsForSave.forEach((propertyName) => {
                    if (data[propertyName] != null) {
                        this[propertyName] = data[propertyName];
                    } else if (data[propertyName] != null) {
                        this[propertyName] = data[propertyName];
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

                ds.app.login(data.address, adapter);

                adapter.onDestroy(() => {
                    if (this.isAuthorised) {
                        this.logout('welcome');
                    }
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
                    .then(() => this.loginSignal.dispatch())
                    .catch((e) => {
                        ds.app.logOut();
                        return Promise.reject(e);
                    });
            }

            /**
             * @private
             */
            _logoutTimer() {
                this.receive(state.signals.sleep, min => {
                    if (min >= this._settings.get('logoutAfterMin')) {
                        this.logout('welcome');
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

            /**
             * @param {Adapter} adapter
             * @returns {boolean}
             * @private
             */
            _isSeedAdapter(adapter) {
                return adapter.type && adapter.type === 'seed';
            }

            /**
             * @param {Adapter} api
             * @returns {boolean}
             * @private
             */
            _isPrivateKeyAdapter(api) {
                return api.type && api.type === 'privateKey';
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
        '$injector',
        'defaultSettings',
        'state',
        'UserRouteState',
        'Poll',
        'timeLine',
        'utils',
        'themes',
        'multiAccount'
    ];

    angular.module('app').factory('user', factory);
})();

/**
 * @typedef {object} IUserSettings
 * @property {Array<string>} assets
 */

/**
 * @typedef {object} ICurrentUser
 * @property {string} address
 * @property {string} name
 * @property {string} publicKey
 * @property {string} userType
 * @property {number} lastLogin
 */
