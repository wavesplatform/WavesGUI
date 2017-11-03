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
     * @param {typeof AppEvent} AppEvent
     * @param {app.utils.decorators} decorators
     * @param $injector
     * @return {EventManager}
     */
    const factory = function (user, Poll, AppEvent, decorators, $injector, EVENT_STATUSES, BalanceComponent) {

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
             * @return {{transfer: string}}
             */
            getAvailableEvents() {
                return EVENT_TYPES;
            }

            addEvent(event) {
                this._addEvent(event);
                this._saveEvents();
            }

            getBalanceEvents() {
                return this.ready.then(() => {
                    const events = [];
                    Object.keys(this._events)
                        .forEach((id) => {
                            this._events[id].components.forEach((component) => {
                                if (component instanceof BalanceComponent) {
                                    events.push(component);
                                }
                            });
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
                        this._onChangeEventsCount();
                    });
            }

            /**
             * @private
             */
            _onChangeEventsCount() {
                if (Object.keys(this._events).length === 0) {
                    this.poll.stop();
                } else {
                    this.poll.play();
                }
            }

            /**
             * @return {Promise}
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

                    if (statusData.status === EVENT_STATUSES.PENDING) {
                        return null;
                    }

                    needSave = true;
                    if (BALANCE_EVENTS.indexOf(this._events[statusData.id].type) !== -1) {
                        hadBalanceEvents = true;
                    }

                    switch (statusData.status) {
                        case EVENT_STATUSES.ERROR:
                            console.error(`Error event ${this._events[statusData.id]}`);
                            delete this._events[statusData.id];
                            break;
                        case EVENT_STATUSES.SUCCESS:
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

            /**
             * @private
             */
            _saveEvents() {
                const result = Object.create(null);
                tsUtils.each(this._events, (event) => {
                    result[event.id] = event.toJSON();
                });
                user.setSetting('events', result);
                this._onChangeEventsCount();
            }

            /**
             *
             * @return {Promise}
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

            /**
             * @param event
             * @private
             */
            _addEvent(event) {
                this._events[event.id] = new AppEvent(event.id);
                this._events[event.id].addComponents(event.components.map((item) => {
                    const Component = $injector.get(EventManager.toClassName(item.name));
                    return new Component({ ...item.data, name: item.name });
                }));
            }

            static toClassName(name) {
                return name.charAt(0).toUpperCase() + name.substr(1) + 'Component';
            }
        }

        return new EventManager();
    };

    factory.$inject = ['user', 'Poll', 'AppEvent', 'decorators', '$injector', 'EVENT_STATUSES', 'BalanceComponent'];

    angular.module('app')
        .factory('eventManager', factory);
})();
