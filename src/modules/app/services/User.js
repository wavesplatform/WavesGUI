/* global transfer Mousetrap WavesApp: readonly */
(function () {
    'use strict';

    const { equals } = require('ramda');
    const { isValidAddress } = require('@waves/signature-adapter');

    /**
     * @param {Storage} storage
     * @param {*} $state
     * @param {app.defaultSettings} defaultSettings
     * @param {State} state
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
        const { pickBy, hasIn } = require('ramda');
        const { Money } = require('@waves/data-entities');
        const analytics = require('@waves/event-sender');

        /**
         * @class User
         */
        class User {

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
             * @type {ICurrentUser|null}
             */
            currentUser = null;
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

            constructor() {
                this._resetFields();

                Mousetrap.bind(['ctrl+shift+k'], () => this.switchNextTheme());
            }

            /**
             * @type {Signal<string>} setting path
             */
            get changeSetting() {
                return this._settings.change;
            }

            get hash() {
                return this.currentUser ? this.currentUser.hash : null;
            }

            get address() {
                return this.currentUser ? this.currentUser.address : null;
            }

            get id() {
                return this.currentUser ? this.currentUser.id : null;
            }

            get name() {
                return this.currentUser ? this.currentUser.name : null;
            }

            set name(name) {
                if (this.currentUser) {
                    this.currentUser.name = name;
                }
            }

            get userType() {
                return this.currentUser ? this.currentUser.userType : null;
            }

            get publicKey() {
                return this.currentUser ? this.currentUser.publicKey : null;
            }

            get matcherSign() {
                return this.currentUser ? this.currentUser.matcherSign : null;
            }

            /**
             * @type {boolean}
             */
            get isAuthorised() {
                return !!this.address;
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

            getDefaultUserSettings(settings) {
                const { common } = this._settings.getSettings();

                return defaultSettings.create({ ...settings }, { ...common });
            }

            /**
             * @param {*} user
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
            getMultiAccountUsersCount() {
                return storage.load('multiAccountUsers').then(users => {
                    return Object.keys(users).length;
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
                return this.saveMultiAccountUser(userToMigrate, userHash)
                    .then(() => this.removeUserByAddress(userToMigrate.address));
            }

            /**
             * @return {Promise}
             */
            saveMultiAccountUser(user, userHash) {
                if (user.settings) {
                    // case: unlock user from userList
                    delete user.settings.encryptionRounds;
                    user.settings = pickBy(
                        (value, key) => hasIn(key, defaultSettings.create().getDefaultSettings())
                    )(user.settings);
                }

                return storage.load('multiAccountUsers')
                    .then(users => this.saveMultiAccountUsers({
                        ...users,
                        [userHash]: { // TODO map user settings to a new schema
                            name: user.name,
                            settings: user.settings,
                            matcherSign: user.matcherSign,
                            lastLogin: user.lastLogin
                        }
                    }));
            }

            deleteMultiAccountUser(userHash) {
                return Promise.all([
                    multiAccount.deleteUser(userHash),
                    storage.load('multiAccountUsers')
                ]).then(([data, users]) => {
                    delete users[userHash];

                    return Promise.all([
                        this.saveMultiAccountUsers(users),
                        this.saveMultiAccount(data)
                    ]);
                });
            }

            /**
             * @return {Promise}
             */
            saveMultiAccountUsers(users) {
                return storage.save('multiAccountUsers', users);
            }

            /**
             * @param {*} commonSettings
             */
            setMultiAccountSettings(commonSettings) {
                this._settings.setCommonSettings(commonSettings);
            }

            /**
             * @returns {Promise}
             */
            getMultiAccountSettings() {
                return storage.load('multiAccountSettings');
            }

            /**
             * @returns {Promise}
             */
            saveMultiAccountSettings(settings) {
                return storage.save('multiAccountSettings', settings);
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

                return this._addUserData(userData).then(() => {
                    this.initScriptInfoPolling();
                    analytics.send({ name: 'Sign In Success' });
                });
            }

            goToActiveState() {
                if (!this.initRouteState) {
                    $state.go(this.getActiveState('wallet'));
                }
            }

            /**
             * @param {string} name
             * @param {string} params
             */
            setInitRouteState(name, params) {
                if (this.initRouteState) {
                    return;
                }
                this.initRouteState = true;
                this.loginSignal.once(() => $state.go(name, params));
            }

            /**
             * @param {object} userData
             * @param {string} userData.userType
             * @param {number} userData.networkByte
             * @param {string} [userData.seed]
             * @param {string} [userData.privateKey]
             * @param {string} [userData.publicKey]
             * @param {string} [userData.id]
             * @param {string} userData.name
             * @param {boolean} [hasBackup]
             * @param {boolean} [restore]
             * @return {Promise}
             */
            create(userData, hasBackup, restore) {
                return this.addUser(userData, hasBackup, restore)
                    .then(createdUser => this.login(createdUser))
                    .then(() => {
                        this.initScriptInfoPolling();

                        if (!restore) {
                            analytics.send({
                                name: 'Create Success',
                                params: {
                                    hasBackup,
                                    userType: userData.userType
                                }
                            });
                        }
                    });
            }

            /**
             * @param {object} userData
             * @param {string} userData.userType
             * @param {number} userData.networkByte
             * @param {string} [userData.seed]
             * @param {string} [userData.privateKey]
             * @param {string} [userData.publicKey]
             * @param {string} [userData.id]
             * @param {string} userData.name
             * @param {boolean} hasBackup
             * @param {boolean} restore
             * @return {Promise}
             */
            addUser(userData, hasBackup, restore) {
                return multiAccount.addUser({
                    userType: userData.userType || 'seed',
                    seed: userData.seed,
                    networkByte: userData.networkByte,
                    privateKey: userData.privateKey,
                    publicKey: userData.publicKey,
                    id: userData.id
                }).then(
                    ({ multiAccountData, multiAccountHash, userHash }) => this.saveMultiAccountUser({
                        ...userData,
                        settings: {
                            hasBackup
                        }
                    }, userHash)
                        .then(() => this.saveMultiAccount({ multiAccountData, multiAccountHash }))
                        .then(() => this.getMultiAccountUsers())
                        .then(multiAccountUsers => {
                            const createdUser = multiAccountUsers.find(user => user.hash === userHash);

                            if (!createdUser) {
                                throw new Error('Can\'t save user');
                            }

                            if (restore) {
                                analytics.send({
                                    name: 'Import Backup Success',
                                    params: { userType: userData.userType }
                                });
                            }

                            return { ...createdUser };
                        })
                );
            }

            /**
             * @param {string} [stateName]
             * @param {boolean} [isSwitch]
             */
            logout(stateName, isSwitch) {
                if (!this.isAuthorised) {
                    return null;
                }

                ds.app.logOut();
                clearTimeout(this._scriptInfoPollTimeoutId);

                if (this._scriptInfoPoll) {
                    this._scriptInfoPoll.destroy();
                }

                if (stateName) {
                    this._resetFields();

                    if (isSwitch) {
                        $state.go(stateName);
                    }

                    this.logoutSignal.dispatch({});

                    if (!isSwitch) {
                        this.changeTheme(themes.getDefaultTheme(), { dontSave: true });
                        multiAccount.signOut();
                        $state.go(stateName, undefined, { custom: { logout: true } });
                    }
                } else if (WavesApp.isDesktop()) {
                    transfer('reload');
                } else {
                    window.location.reload();
                }
            }

            resetAll() {
                return Promise.all([
                    storage.save('multiAccountData', ''),
                    storage.save('multiAccountHash', ''),
                    storage.save('multiAccountUsers', ''),
                    storage.save('userList', ''),
                    storage.save('termsAccepted', false)
                ]);
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
             * @param {*} state    state name
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
                return storage.onReady()
                    .then(() => storage.load('userList'))
                    .then(list => {
                        if (Array.isArray(list)) {
                            return list.sort((a, b) => b.lastLogin - a.lastLogin);
                        }
                        return [];
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

            /**
             * @param {string} theme
             * @param {*} [options]
             * @param {boolean} [options.dontSave] Use that for change theme without saving to user settings
             */
            changeTheme(theme, options) {
                const currentTheme = this.getSetting('theme');
                const newTheme = themes.changeTheme(theme || this.getSetting('theme'));

                if (currentTheme !== newTheme && options && !options.dontSave) {
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
             * @returns {Promise<{signature: string, timestamp: number}>}
             */
            addMatcherSign() {
                return utils.signUserOrders({
                    matcherSign: this.matcherSign
                }).then(matcherSign => {
                    this.currentUser.matcherSign = matcherSign;
                    ds.app.addMatcherSign(matcherSign.timestamp, matcherSign.signature);
                });
            }

            /**
             * @private
             */
            _resetFields() {
                this.networkError = false;
                this.currentUser = null;
                this.extraFee = null;
                this.changeScript = new tsUtils.Signal();
                this.setScamSignal = new tsUtils.Signal();
                this.scam = Object.create(null);
                this.__props = Object.create(null);
                this._changeTimer = null;
                this._stateList = null;
                this._history = [];
                this._hasScript = false;
                this._scriptInfoPoll = null;
                this._scriptInfoPollTimeoutId = null;

                if (this._settings) {
                    this._settings.change.off();
                }

                let commonSettings;

                if (this._settings) {
                    commonSettings = this._settings.getSettings().common;

                    this._settings.change.off();
                }

                this._settings = defaultSettings.create({}, commonSettings);
                this._settings.change.on(() => this._onChangeSettings());

                ds.dataManager.dropAddress();
            }

            /**
             * @param {object} userData
             * @param {string} userData.name
             * @param {string} userData.userType
             * @param {string} userData.address
             * @param {string} userData.hash
             * @param {string} [userData.id]
             * @param {string} [userData.publicKey]
             * @param {string} [userData.matcherSign]
             * @param {object} [userData.settings]
             * @return {Promise}
             * @private
             */
            _addUserData(userData) {
                this.currentUser = {
                    hash: userData.hash,
                    name: userData.name,
                    id: userData.id,
                    address: userData.address,
                    publicKey: userData.publicKey,
                    userType: userData.userType,
                    settings: userData.settings,
                    matcherSign: userData.matcherSign,
                    lastLogin: Date.now()
                };

                this._setObserve();

                analytics.addDefaultParams({ userType: this.userType });

                let commonSettings;

                if (this._settings) {
                    commonSettings = this._settings.getSettings().common;

                    this._settings.change.off();
                }

                this._settings = defaultSettings.create(this.currentUser.settings, commonSettings);
                this._settings.change.on(() => this._onChangeSettings());

                const states = WavesApp.stateTree.find('main').getChildren();
                this._stateList = states.map((baseTree) => {
                    const id = baseTree.id;
                    return new UserRouteState('main', id, this._settings.get(`${id}.activeState`));
                });

                Object.keys(WavesApp.network).forEach((key) => {
                    ds.config.set(key, this._settings.get(`network.${key}`));
                });

                ds.config.set('oracleWaves', this.getSetting('oracleWaves'));

                ds.app.login(userData);

                return this.addMatcherSign()
                    .catch(() => Promise.resolve())
                    .then(() => {
                        this.changeTheme(this._settings.get('theme'));
                        this.changeCandle();

                        return this.saveMultiAccountUser(this.currentUser, this.currentUser.hash);
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
                        this.logout('signIn');
                    }
                });
            }

            /**
             * @private
             */
            _onChangeSettings() {
                const { common, settings } = this._settings.getSettings();

                if (this.currentUser) {
                    this.currentUser.settings = { ...settings };
                }

                this.saveMultiAccountSettings(common);
            }

            /**
             * @private
             */
            _onChangePropsForSave() {
                if (!this._changeTimer) {
                    this._changeTimer = timeLine.timeout(() => {
                        this._changeTimer = null;
                        this.saveMultiAccountUser(this.currentUser, this.currentUser.hash);
                    }, 500);
                }
            }

            /**
             * @private
             */
            _setObserve() {
                Object.keys(this.currentUser).forEach(key => {
                    this._observe(key, this.currentUser);
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
                        if (!equals(value, this.__props[key])) {
                            this.__props[key] = value;
                            this._onChangePropsForSave();
                        }
                    }
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
 * @property {string} hash
 * @property {string} address
 * @property {string} id
 * @property {string} name
 * @property {string} publicKey
 * @property {string} userType
 * @property {number} lastLogin
 * @property {object} settings
 * @property {object} matcherSign
 */
