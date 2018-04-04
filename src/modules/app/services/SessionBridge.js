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
                const userDataHash = this._getOterSessions().reduce((result, sessionId) => {
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
             * @param data
             * @param {string} data.id
             * @param {string} data.referer
             * @private
             */
            _getLoginData(data) {
                return this._setResponseSuccess(data.id, data.referer, {
                    address: user.address,
                    password: user._password
                });
            }

            /**
             * @param {string} id
             * @param {string} referer
             * @param {object} body
             * @private
             */
            _setResponseSuccess(id, referer, body) {
                this._setResponse(id, referer, 'success', { data: body });
            }

            /**
             * @param {string} id
             * @param {string} referer
             * @param {object} body
             * @private
             */
            _setResponseError(id, referer, message) {
                this._setResponse(id, referer, 'error', { message });
            }

            /**
             * @param {string} id
             * @param {string} referer
             * @param {'error'|'success'} status
             * @param {object} data
             * @private
             */
            _setResponse(id, referer, status, data) {
                const command = this._getCommandKey(referer, 'response');
                this._dispatch(command, {
                    id,
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
             * @param {any} [data]
             * @return {Promise<IResponce>}
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
                        this._api[cmd](commandData);
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
                    id: this._sessionId
                }));
            }

            /**
             * @return {Array<string>}
             * @private
             */
            _getAllSesions() {
                return JSON.parse(localStorage.getItem(this._sessionListKey) || '[]');
            }

            /**
             * @return {string[]}
             * @private
             */
            _getOterSessions() {
                return this._getAllSesions().filter((sessionId) => sessionId !== this._sessionId);
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
 */

/**
 * @typedef {object} ICommandData
 * @property {string} id
 * @property {string} referer
 * @property {object} data
 */

/**
 * @typedef {object} IResponce
 * @property {'error'|'success'} status
 * @property {string} [message]
 * @property {object} [data]
 */

/**
 * @typedef {object} IBridgeSignals
 * @property {Signal<ISessionUserData[]>} changeSessions
 */
