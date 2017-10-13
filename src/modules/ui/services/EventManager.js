(function () {
    'use strict';

    /**
     * @type {{transfer: string}}
     */
    const EVENT_TYPES = {
        transfer: 'transfer'
    };
    const BALANCE_EVENTS = [EVENT_TYPES.transfer];

    /**
     * @param {User} user
     * @param {Poll} Poll
     * @param {class AppEvent} AppEvent
     * @param {class TransferEvent} TransferEvent
     * @param {app.utils.decorators} decorators
     * @returns {EventManager}
     */
    const factory = function (user, Poll, AppEvent, ChangeBalanceEvent, TransferEvent, decorators) {

        class EventManager {

            constructor() {
                this._events = Object.create(null);
                this.ready = null;
                this.poll = null;

                /**
                 * @type {{eventEnd: Signal, balanceEventEnd: Signal}}
                 */
                this.signals = {
                    eventEnd: new tsUtils.Signal(),
                    balanceEventEnd: new tsUtils.Signal()
                };

                this._initialize();
            }

            /**
             * @returns {{transfer: string}}
             */
            getAvailableEvents() {
                return EVENT_TYPES;
            }

            addEvent(event) {
                this._addEvent(event);
                this._saveEvents();
            }

            /**
             * @returns {Promise<ChangeBalanceEvent>}
             */
            @decorators.cachable(2)
            getBalanceEvents() {
                return this.ready.then(() => {
                    const events = [];
                    Object.keys(this._events)
                        .forEach((id) => {
                            const event = this._events[id];
                            if (event instanceof ChangeBalanceEvent) {
                                events.push(event);
                            }
                        });
                    return events;
                });
            }

            /**
             *
             * @private
             */
            _initialize() {
                this.ready = this._loadEvents()
                    .then(() => {
                        this.poll = new Poll(this._getStatuses.bind(this), this._applyStatuses.bind(this), 2000);
                    });
            }

            /**
             * @returns {Promise}
             * @private
             */
            _getStatuses() {
                const promises = [];

                tsUtils.each(this._events, (event) => {
                    promises.push(event.getStatus());
                });

                return Promise.all(promises);
            }

            /**
             * @private
             */
            _applyStatuses(statuses) {
                let needSave = false;
                let hadBalanceEvents = false;
                statuses.forEach((statusData) => {

                    if (statusData.status === AppEvent.statuses.PENDING) {
                        return null;
                    }

                    needSave = true;
                    if (BALANCE_EVENTS.indexOf(this._events[statusData.id].type) !== -1) {
                        hadBalanceEvents = true;
                    }

                    switch (statusData.status) {
                        case AppEvent.statuses.ERROR:
                            console.error(`Error event ${this._events[statusData.id]}`);
                            delete this._events[statusData.id];
                            break;
                        case AppEvent.statuses.SUCCESS:
                            console.log(`Event with id "${statusData.id}" finished!`);
                            delete this._events[statusData.id];
                            break;
                    }
                });


                if (needSave) {
                    this._saveEvents();
                    if (hadBalanceEvents) {
                        this.signals.balanceEventEnd.dispatch();
                    }
                    this.signals.eventEnd.dispatch();
                }
            }

            _saveEvents() {
                const result = Object.create(null);
                tsUtils.each(this._events, (event) => {
                    result[event.id] = event.toJSON();
                });
                user.setSetting('events', result);
            }

            /**
             *
             * @returns {Promise}
             * @private
             */
            _loadEvents() {
                return user.getSetting('events')
                    .then(this._parseEventList.bind(this));
            }

            /**
             *
             * @param eventList
             * @private
             */
            _parseEventList(eventList) {
                tsUtils.each(eventList, this._addEvent, this);
            }

            _addEvent(event) {
                switch (event.type) {
                    case EVENT_TYPES.transfer:
                        this._events[event.data.id] = new TransferEvent({ ...event.data, type: event.type });
                        break;
                    default:
                        throw new Error('Wrong event type!');
                }
            }
        }

        return new EventManager();
    };

    factory.$inject = ['user', 'Poll', 'AppEvent', 'ChangeBalanceEvent', 'TransferEvent', 'decorators'];

    angular.module('app.ui')
        .factory('eventManager', factory);
})();
