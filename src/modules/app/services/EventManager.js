(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {Poll} Poll
     * @param {$injector} $injector
     * @param {TxEvent} TxEvent
     * @param {app.utils} utils
     * @return {EventManager}
     */
    const factory = function (user, Poll, $injector, TxEvent, utils) {

        class EventManager {

            constructor() {
                /**
                 * @type {Promise}
                 */
                this.ready = null;
                /**
                 * @type {{changeBalanceEvent: Signal}}
                 */
                this.signals = {
                    changeBalanceEvent: new tsUtils.Signal()
                };
                /**
                 * @type {Poll}
                 * @private
                 */
                this._poll = null;
                /**
                 * @type {Object}
                 * @private
                 */
                this._events = Object.create(null);
                /**
                 * @type {Waves}
                 * @private
                 */
                this._waves = null;

                user.onLogin().then(this._initialize.bind(this));
            }

            addTx(tx, moneyList) {
                this._events[tx.id] = new TxEvent(tx.id, moneyList);
                this._syncEventList();
                this._resetPoll();
            }

            getReservedMoneyList() {
                return Object.keys(this._events).reduce((list, eventId) => {
                    return list.concat(this._events[eventId].getReservedMoneyList());
                }, []);
            }

            /**
             * @private
             */
            _initialize() {
                this._waves = $injector.get('waves');
                this._waves.node.transactions.listUtx()
                    .then((list) => {
                        const events = user.getSetting('events');
                        const utxHash = utils.toHash(list, 'id');

                        Object.keys(events).forEach((id) => {
                            if (!utxHash[id]) {
                                this._removeEvent(id, true);
                            }
                        });

                        if (list && list.length) {
                            this._resetPoll();
                        }
                    });
            }

            /**
             * @param {object} tx
             * @param {string} [tx.id]
             * @private
             */
            _addEvent(tx) {
                if (!this._events[tx.id]) {
                    this._events[tx.id] = new TxEvent(tx.id, EventManager._getMoneyListData(tx));
                    this._syncEventList();
                    return true;
                }
            }

            /**
             * @param {string} id
             * @param {boolean} [force]
             * @private
             */
            _removeEvent(id, force) {
                if (this._events[id] || force) {
                    delete this._events[id];
                    this._syncEventList();
                    if (!force) {
                        this.signals.changeBalanceEvent.dispatch();
                    }
                    // utils.when(this._waves.node.transactions.get(id)) // TODO : UTX problems
                    //     .then((tx) => {
                    //         notification.info({
                    //             ns: 'app.ui',
                    //             title: { literal: 'Transaction finished success!' }
                    //         });
                    //     }, (error) => {
                    //         notification.error({
                    //             ns: 'app.ui',
                    //             title: { literal: 'Transaction finished error!' }
                    //         });
                    //         console.error(error, id);
                    //     });
                }
            }

            _resetPoll() {
                if (this._poll) {
                    this._poll.destroy();
                }
                setTimeout(() => {
                    this._poll = new Poll(this._waves.node.transactions.listUtx, this._addUtxList.bind(this), 1000);
                }, 1000);
            }

            _addUtxList(list) {
                let dispatch = false;
                const utxHash = utils.toHash(list, 'id');

                Object.keys(this._events)
                    .forEach((id) => {
                        if (!utxHash[id]) {
                            this._removeEvent(id);
                            dispatch = true;
                        }
                    });

                if (list.length) {
                    list.forEach((tx) => {
                        if (!this._events[tx.id]) {
                            this._addEvent(tx);
                            dispatch = true;
                        }
                    });
                    if (dispatch) {
                        this.signals.changeBalanceEvent.dispatch();
                    }
                } else if (this._poll) {
                    this._poll.destroy();
                    this._poll = null;
                }
            }

            _syncEventList() {
                const result = Object.create(null);
                Object.keys(this._events)
                    .forEach((id) => {
                        result[id] = true;
                    });
                user.setSetting('events', result);
            }

            static _getMoneyListData(tx) {
                const moneyList = [tx.fee];
                if (tx.type === Waves.constants.TRANSFER_TX) {
                    moneyList.push(tx.amount);
                }
                return moneyList;
            }

        }

        return utils.bind(new EventManager());
    };

    factory.$inject = [
        'user',
        'Poll',
        '$injector',
        'TxEvent',
        'utils'
    ];

    angular.module('app').factory('eventManager', factory);
})();
