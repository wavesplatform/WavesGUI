(function () {
    'use strict';

    const { Signal } = require('ts-utils');

    /**
     * @param {User} user
     * @param {Poll} Poll
     * @param {app.utils} utils
     * @param {Waves} waves
     */
    const factory = function (user, Poll, utils, waves) {

        class BalanceWatcher {

            change = new Signal();
            /**
             * @type {Array}
             * @private
             */
            _balance = [];
            /**
             * @type {Poll}
             * @private
             */
            _poll = null;


            constructor() {
                user.onLogin().then(() => this._watch());
            }

            getBalance() {
                return utils.toHash(this._balance, 'asset.id');
            }

            /**
             * @private
             */
            _watch() {
                const get = () => this._getBalanceList();
                const set = list => this._setBalanceList(list);
                this._poll = new Poll(get, set, 1000);
            }

            /**
             * @return {Promise<Money[]>}
             * @private
             */
            _getBalanceList() {
                return waves.node.assets.userBalances()
                    .then((list) => list.map(({ available }) => available))
                    .then((list) => list.filter((money) => money.getTokens().gt(0)));

            }

            /**
             * @param {Array<Money>} balances
             * @return {null}
             * @private
             */
            _setBalanceList(balances) {
                const comparator = utils.comparators.process(money => money.asset.id).asc;
                const list = balances.slice().sort(comparator);

                const apply = () => {
                    this.change.dispatch(utils.toHash(list, 'asset.id'));
                    this._balance = list;
                };

                if (list.length !== this._balance.length) {
                    apply();
                    return null;
                }

                const isEqual = list.some((money, i) => money.asset.id !== this._balance[i].asset.id ||
                    !money.getTokens().eq(this._balance[i].getTokens()));

                if (!isEqual) {
                    apply();
                }
            }

        }

        return new BalanceWatcher();
    };

    factory.$inject = ['user', 'Poll', 'utils', 'waves'];

    angular.module('app').factory('balanceWatcher', factory);
})();
