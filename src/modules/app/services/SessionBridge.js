(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {app.utils} utils
     * @return {SessionBridge}
     */
    const factory = function (user, utils) {
        const tsUtils = require('ts-utils');

        class SessionBridge {

            /**
             * @return {string}
             * @private
             */
            get _sessionListKey() {
                return `${this._key}-sessionList`;
            }

            constructor() {
                /**
                 * @type {string}
                 * @private
                 */
                this._sessionId = `s_${Date.now()}`;
                /**
                 * @type {string}
                 * @private
                 */
                this._key = '__sb';
                /**
                 * @type {any}
                 * @private
                 */
                this._messageHash = Object.create(null);
                /**
                 * @type {IBridgeSignals}
                 */
                this.signals = utils.liteObject({
                    changeSessions: new tsUtils.Signal()
                });

                this._api = utils.liteObject({
                    getLoginData: (commandData) => this._getLoginData(commandData),
                    sign: (commandData) => this._sign(commandData),
                    response: (commandData) => this._onResponse(commandData)
                });

                this._setHandlers();

                user.onLogin().then(() => {
                    this._addSession();
                    this._addUserData();
                });
            }

            /**
             * @return {ISessionUserData[]}
             */
            getSessionsData() {
                /**
                 * @type {object}
                 */
                const userDataHash = this._getOtherSessions().reduce((result, sessionId) => {
                    const userData = this._getUserDataBySession(sessionId);
                    if (userData) {
                        result[userData.address] = userData;
                    } else {
                        this._clearCommand(this._getSessionDataKey(sessionId));
                    }
                    return result;
                }, Object.create(null));
                return Object.values(userDataHash);
            }

            /**
             * @param {string} sessionId
             * @return Promise
             */
            login(sessionId) {
                return this._runCommand('getLoginData', sessionId)
                    .then((response) => {
                        if (response.status === 'success') {
                            user.login(response.data);
                        } else {
                            // console.error(response); TODO
                        }
                    });
            }

            /**
             * @param {string} type
             * @param {object} tx
             */
            sign(type, tx) {
                /**
                 * @type {void|ISessionUserData}
                 */
                const master = this._getMasterSessionId(user.address);
                return this._runCommand('sign', master && master.id, { type, tx });
            }

            /**
             * @param request
             * @param {string} request.id
             * @param {string} request.referer
             * @private
             */
            _getLoginData(request) {
                return this._setResponseSuccess(request, {
                    address: user.address
                });
            }

            /**
             * @param request
             * @param {string} request.id
             * @param {string} request.referer
             * @param {object} request.data
             * @param {string} request.data.type
             * @param {object} request.data.tx
             * @private
             */
            _sign(request) {
                /**
                 * @type {ITransactionClass}
                 */
                let transaction;

                switch (request.data.type) {
                    case 'order':
                        transaction = new Waves.Transactions.Order(request.data.tx);
                        break;
                    case Waves.constants.ISSUE_TX_NAME:
                        transaction = new Waves.Transactions.IssueTransaction(request.data.tx);
                        break;
                    case Waves.constants.TRANSFER_TX_NAME:
                        transaction = new Waves.Transactions.TransferTransaction(request.data.tx);
                        break;
                    case Waves.constants.REISSUE_TX_NAME:
                        transaction = new Waves.Transactions.ReissueTransaction(request.data.tx);
                        break;
                    case Waves.constants.BURN_TX_NAME:
                        transaction = new Waves.Transactions.BurnTransaction(request.data.tx);
                        break;
                    case Waves.constants.LEASE_TX_NAME:
                        transaction = new Waves.Transactions.LeaseTransaction(request.data.tx);
                        break;
                    case Waves.constants.CANCEL_LEASING_TX_NAME:
                        transaction = new Waves.Transactions.CancelLeasingTransaction(request.data.tx);
                        break;
                    case Waves.constants.CREATE_ALIAS_TX_NAME:
                        transaction = new Waves.Transactions.CreateAliasTransaction(request.data.tx);
                        break;
                    case Waves.constants.MASS_TRANSFER_TX_NAME:
                        throw new Error('Unsupported method mass transfer!');
                    default:
                        throw new Error('Unknown transaction type!');
                }

                user.getSeed()
                    .then((seed) => transaction.prepareForAPI(seed.keyPair.privateKey))
                    .then((prepareData) => this._setResponseSuccess(request, prepareData))
                    .catch((e) => {
                        this._setResponseError(request, e);
                    });
            }

            /**
             * @param {object} request
             * @param {string} request.id
             * @param {string} request.referer
             * @param {object} body
             * @private
             */
            _setResponseSuccess(request, body) {
                this._setResponse(request, 'success', { data: body });
            }

            /**
             * @param {object} request
             * @param {string} request.id
             * @param {string} request.referer
             * @param {object} body
             * @private
             */
            _setResponseError(request, message) {
                this._setResponse(request, 'error', { message });
            }

            /**
             * @param {object} request
             * @param {string} request.id
             * @param {string} request.referer
             * @param {'error'|'success'} status
             * @param {object} data
             * @private
             */
            _setResponse(request, status, data) {
                const command = this._getCommandKey(request.referer, 'response');
                this._dispatch(command, {
                    id: request.id,
                    referer: this._sessionId,
                    data: {
                        status,
                        ...data
                    }
                });
                setTimeout(() => {
                    this._clearCommand(command);
                }, 100);
            }

            /**
             * @param {string} apiMethod
             * @param {string} targetSessionId
             * @param {*} [data]
             * @return {Promise<IResponse>}
             * @private
             */
            _runCommand(apiMethod, targetSessionId, data) {
                return new Promise((resolve) => {
                    const id = tsUtils.uniqueId('cmd__');
                    const params = { id, data, referer: this._sessionId };
                    const command = this._getCommandKey(targetSessionId, apiMethod);

                    this._messageHash[id] = (result) => {
                        delete this._messageHash[id];
                        this._clearCommand(command);
                        resolve(result);
                    };

                    this._dispatch(command, params);

                    setTimeout(() => {
                        if (this._messageHash[id]) {
                            this._messageHash[id]({
                                status: 'error',
                                message: new Error('Timeout limit error!')
                            });
                        }
                    }, 1000);
                });
            }

            /**
             * @param {string} storageKey
             * @param {ICommandData} data
             * @private
             */
            _dispatch(storageKey, data) {
                localStorage.setItem(storageKey, JSON.stringify(data));
            }

            /**
             * @param {string} storageKey
             * @private
             */
            _clearCommand(storageKey) {
                localStorage.removeItem(storageKey);
            }

            /**
             * @param {ICommandData} commandData
             * @private
             */
            _onResponse(commandData) {
                if (this._messageHash[commandData.id]) {
                    this._messageHash[commandData.id](commandData.data);
                }
            }

            /**
             * @private
             */
            _setHandlers() {
                window.addEventListener('storage', (event) => this._onStorageEvent(event), false);
                window.addEventListener('unload', () => this._destroy(), false);
            }

            /**
             * @param {StorageEvent} event
             * @private
             */
            _onStorageEvent(event) {
                if (event.newValue) {
                    const cmd = this._parseCommand(event.key);
                    if (cmd && cmd in this._api) {
                        const commandData = JSON.parse(localStorage.getItem(event.key));
                        try {
                            this._api[cmd](commandData);
                        } catch (e) {
                            if (cmd !== 'response') {
                                this._setResponseError(commandData, e);
                            }
                        }
                    } else if (event.key === this._sessionListKey) {
                        this.signals.changeSessions.dispatch(this.getSessionsData());
                    }
                }
            }

            /**
             * @private
             */
            _destroy() {
                this._removeSession();
                this._removeUserData();
            }

            /**
             * @private
             */
            _addSession() {
                const sessions = JSON.parse(localStorage.getItem(this._sessionListKey) || '[]');
                sessions.push(this._sessionId);
                localStorage.setItem(this._sessionListKey, JSON.stringify(sessions));
            }

            /**
             * @private
             */
            _removeSession() {
                const sessions = JSON.parse(localStorage.getItem(this._sessionListKey) || '[]');
                const index = sessions.indexOf(this._sessionId);
                if (index !== -1) {
                    sessions.splice(index, 1);
                    localStorage.setItem(this._sessionListKey, JSON.stringify(sessions));
                }
            }

            /**
             * @private
             */
            _addUserData() {
                localStorage.setItem(this._getSessionDataKey(), JSON.stringify({
                    name: user.name,
                    address: user.address,
                    id: this._sessionId,
                    isMaster: user.isMaster()
                }));
            }

            /**
             * @param {string} address
             * @return {void | ISessionUserData}
             * @private
             */
            _getMasterSessionId(address) {
                return tsUtils.find(this.getSessionsData(), { address, isMaster: true });
            }

            /**
             * @return {Array<string>}
             * @private
             */
            _getAllSessions() {
                return JSON.parse(localStorage.getItem(this._sessionListKey) || '[]');
            }

            /**
             * @return {string[]}
             * @private
             */
            _getOtherSessions() {
                return this._getAllSessions().filter((sessionId) => sessionId !== this._sessionId);
            }

            /**
             * @param {string} [sessionId]
             * @private
             */
            _removeUserData(sessionId) {
                localStorage.removeItem(this._getSessionDataKey(sessionId));
            }

            /**
             * @param {string} sessionId
             * @return {ISessionUserData}
             * @private
             */
            _getUserDataBySession(sessionId) {
                return JSON.parse(localStorage.getItem(this._getSessionDataKey(sessionId)));
            }

            /**
             * @param {string} [sessionId]
             * @return {string}
             * @private
             */
            _getSessionDataKey(sessionId = this._sessionId) {
                return `${this._key}-${sessionId}`;
            }

            /**
             * @param {string} sessionId
             * @param {string} cmd
             * @return {string}
             * @private
             */
            _getCommandKey(sessionId, cmd) {
                return `${this._getSessionDataKey(sessionId)}-${cmd}-cmd`;
            }

            /**
             * @param {string} localStorageKey
             * @return {string|null}
             * @private
             */
            _parseCommand(localStorageKey) {
                const [sessionId, cmd] = localStorageKey.split('-').slice(1, -1);
                if (sessionId && cmd && sessionId === this._sessionId) {
                    return cmd;
                } else {
                    return null;
                }
            }

        }

        return new SessionBridge();
    };

    factory.$inject = ['user', 'utils'];

    angular.module('app').factory('sessionBridge', factory);
})();

/**
 * @typedef {object} ISessionUserData
 * @property {string} name
 * @property {string} address
 * @property {string} id
 * @property {boolean} isMaster
 */

/**
 * @typedef {object} ICommandData
 * @property {string} id
 * @property {string} referer
 * @property {object} data
 */

/**
 * @typedef {object} IResponse
 * @property {'error'|'success'} status
 * @property {string} [message]
 * @property {object} [data]
 */

/**
 * @typedef {object} IBridgeSignals
 * @property {Signal<ISessionUserData[]>} changeSessions
 */
