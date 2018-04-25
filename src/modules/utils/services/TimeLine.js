(function () {
    'use strict';

    /**
     * @param {typeof PromiseControl} PromiseControl
     * @return {TimeLine}
     */
    const factory = function (PromiseControl) {

        class TimerList {

            constructor() {
                /**
                 * @type {ITimerData[]}
                 */
                this.list = [];
            }

            /**
             * @param {ITimerData} item
             */
            add(item) {
                this.list.push(item);
                this.list.sort(TimerList.comparator);
            }

            /**
             * @param {ITimerData|string} item
             */
            remove(id) {
                id = typeof id === 'string' ? id : id.id;
                for (let i = this.list.length; i--;) {
                    if (this.list[i].id === id) {
                        this.list.splice(i, 1);
                        break;
                    }
                }
            }

            /**
             * @param {ITimerData} a
             * @param {ITimerData} b
             * @return {number}
             */
            static comparator(a, b) {
                return (b.start + b.timeout) - (a.start + a.timeout);
            }

        }

        class TimeLine {

            constructor() {
                /**
                 * @type {TimerList}
                 * @private
                 */
                this._listeners = new TimerList();
                /**
                 * @type {number}
                 * @private
                 */
                this._timer = null;
            }

            /**
             * @param {function} callback
             * @param {number} timeout
             * @return {PromiseControl}
             */
            timeout(callback, timeout) {
                const start = Date.now();
                const id = tsUtils.uniqueId('timeLineItem');
                const defer = $.Deferred();
                const promise = new PromiseControl(defer.promise());
                promise.id = id;
                promise.start = start;
                promise.time = timeout;
                this._listeners.add({
                    handler: callback,
                    timeout,
                    start,
                    id,
                    defer
                });
                if (this._listeners.list.length === 1) {
                    this._addTimeout();
                }
                return promise;
            }

            /**
             * @param {number} timeout
             * @return {PromiseControl}
             */
            wait(timeout) {
                return this.timeout(null, timeout);
            }

            /**
             * @param {PromiseControl} promise
             */
            cancel(promise) {
                if (!promise) {
                    return null;
                }
                promise.drop();
                this._listeners.remove(promise.id);
            }

            /**
             * @private
             */
            _run() {
                if (!this._listeners.list.length) {
                    return null;
                }

                const now = Date.now();
                for (let i = this._listeners.list.length - 1; i >= 0; i--) {
                    const item = this._listeners.list[i];
                    if (now - item.start >= item.timeout) {
                        if (item.handler) {
                            item.handler();
                        }
                        item.defer.resolve();
                        this._listeners.remove(item);
                    } else {
                        break;
                    }
                }
                if (this._listeners.list.length) {
                    this._addTimeout();
                }
            }

            /**
             * @private
             */
            _addTimeout() {
                if (this._timer) {
                    clearTimeout(this._timer);
                }
                this._timer = setTimeout(() => {
                    this._timer = null;
                    this._run();
                }, 200);
            }

        }

        return new TimeLine();
    };

    factory.$inject = ['PromiseControl'];

    angular.module('app.utils').factory('timeLine', factory);
})();

/**
 * @typedef {object} ITimerData
 * @property {Function} handler
 * @property {number} timeout
 * @property {number} start
 * @property {string} id
 * @property {deferred} defer
 */
