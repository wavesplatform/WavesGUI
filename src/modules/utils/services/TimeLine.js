(function () {
    'use strict';

    /**
     * @param $q
     * @param {typeof PromiseControl} PromiseControl
     * @return {TimeLine}
     */
    const factory = function ($q, PromiseControl) {

        class TimeLine {

            constructor() {
                this._listeners = [];
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
                const defer = $q.defer();
                const promise = new PromiseControl(defer.promise);
                promise.id = id;
                promise.start = start;
                promise.time = timeout;
                this._listeners.push({
                    handler: callback,
                    timeout,
                    start,
                    id,
                    defer
                });
                if (this._listeners.length === 1) {
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
                let index = null;
                const hasId = this._listeners.some((item, i) => {
                    if (item.id === promise.id) {
                        index = i;
                    }
                    return index !== null;
                });
                if (hasId) {
                    this._listeners.splice(index, 1);
                }
            }

            /**
             * @private
             */
            _run() {
                if (!this._listeners.length) {
                    return null;
                }

                const now = Date.now();
                for (let i = this._listeners.length - 1; i--;) {
                    const item = this._listeners[i];
                    if (now - item.start >= item.timeout) {
                        if (item.handler) {
                            item.handler();
                        }
                        item.defer.resolve();
                        this._listeners.splice(i, 1);
                    }
                }
                if (this._listeners.length) {
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
                }, 500);
            }

        }

        return new TimeLine();
    };

    factory.$inject = ['$q', 'PromiseControl'];

    angular.module('app.utils').factory('timeLine', factory);
})();
