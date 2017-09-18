(function () {
    'use strict';

    const factory = function () {

        class EventManager {

            constructor() {
                /**
                 * @type {Signal}
                 */
                this.changeEvents = new tsUtils.Signal();
                /**
                 * @type {Array}
                 * @private
                 */
                this._events = [];
            }

            /**
             * @return {Array}
             */
            getEvents() {
                return this._events;
            }

            /**
             * @param event
             * @param {Promise} endEventPromise
             */
            addEvent(event, endEventPromise) {
                this._events.push(event);
                this.changeEvents.dispatch();
                endEventPromise.then(() => {
                    this._events = this._events.filter(tsUtils.notContains(event));
                    this.changeEvents.dispatch();
                });
            }

        }

        return new EventManager();
    };

    factory.$inject = [];

    angular.module('app.ui')
        .factory('eventManager', factory);
})();
