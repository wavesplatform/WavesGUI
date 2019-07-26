(function () {
    'use strict';

    const { Signal } = require('ts-utils');
    const { Money } = require('@waves/data-entities');
    const { not, pathEq } = require('ramda');

    /**
     * @param {User} user
     * @param {Poll} Poll
     * @param {app.utils} utils
     * @param {Waves} waves
     */
    const factory = function (user, Poll, utils, waves) {

        class BalanceWatcher {

            /**
             * @type {Signal<any>}
             */
            change = new Signal();
            /**
             * @type {Promise}
             */
            ready;
            /**
             * @type {Array<IBalanceItem>}
             * @private
             */
            _balance = [];
            /**
             * @type {Poll}
             * @private
             */
            _poll = null;
            /**
             * @type {Function}
             * @private
             */
            _resolve;
            /**
             * @type {Function}
             * @private
             */
            _reject;

            constructor() {
                this.ready = new Promise((resolve, reject) => {
                    this._resolve = resolve;
                    this._reject = reject;
                });

                user.onLogin().then(
                    () => this._handleLogin(),
                    () => this._handleLogout()
                );
            }

            /**
             * @return {Record<string, Money>}
             */
            getBalance() {
                return this._getHash();
            }

            /**
             * @param {Asset} asset
             * @return Money
             */
            getBalanceByAsset(asset) {
                const hash = this.getBalance();
                return hash[asset.id] ? hash[asset.id] : new Money(0, asset);
            }

            /**
             * @param {Array<Asset>} assetList
             * @return Array<Money>
             */
            getBalanceByAssetList(assetList) {
                return assetList.map(this.getBalanceByAsset, this);
            }

            /**
             * @param {string} id
             * @return {Promise<Money>}
             */
            getBalanceByAssetId(id) {
                return waves.node.assets.getAsset(id)
                    .then(this.getBalanceByAsset.bind(this));
            }

            /**
             * @param {string} id
             * @return {Promise<IBalanceDetails>}
             */
            getFullBalanceByAssetId(id) {
                const balance = this._balance.find(pathEq(['asset', 'id'], id));
                if (balance) {
                    return Promise.resolve(balance);
                }
                return waves.node.assets.getAsset(id).then(asset => {
                    const empty = new Money(0, asset);
                    return {
                        asset,
                        regular: empty,
                        available: empty,
                        inOrders: empty,
                        leasedOut: empty,
                        leasedIn: empty
                    };
                });
            }

            /**
             * @return {Array<IBalanceDetails>}
             */
            getFullBalanceList() {
                return this._balance.map(item => ({ ...item }));
            }

            /**
             * @private
             */
            _handleLogin() {
                this._watch();

                user.logoutSignal.once(this._handleLogout, this);
            }

            /**
             * @private
             */
            _handleLogout() {
                if (this._poll) {
                    this._poll.destroy();
                }

                user.loginSignal.once(this._handleLogin, this);
            }

            /**
             * @private
             */
            _watch() {
                const get = () => BalanceWatcher._getBalanceList();
                const set = list => this._setBalanceList(list);
                this._poll = new Poll(get, set, 1000);
                this._poll.ready.then(this._resolve, this._reject);
            }

            /**
             * @private
             */
            _dispatch() {
                this.change.dispatch(this._getHash());
            }

            /**
             * @return {*}
             * @private
             */
            _getHash() {
                return utils.toHash(this._balance.map(item => item.available), 'asset.id');
            }

            /**
             * @param {Array<IBalanceItem>} list
             * @return {null}
             * @private
             */
            _setBalanceList(list) {
                const dispatch = () => {
                    this._balance = list;
                    this._dispatch();
                };

                if (list.length !== this._balance.length) {
                    dispatch();
                    return null;
                }


                const itemNotEqual = (a, b) => not(utils.isEqual(a.available, b.available));
                const isNeedDispatch = list.length &&
                    list.some((item, i) => itemNotEqual(item, this._balance[i]));

                if (isNeedDispatch) {
                    dispatch();
                }
            }

            /**
             * @return {Promise<Money[]>}
             * @private
             */
            static _getBalanceList() {
                return waves.node.assets.userBalances();
            }

        }

        return new BalanceWatcher();
    };

    factory.$inject = ['user', 'Poll', 'utils', 'waves'];

    angular.module('app').factory('balanceWatcher', factory);
})();
