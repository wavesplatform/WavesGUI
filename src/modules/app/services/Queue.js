(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @return {Queue}
     */
    const factory = function (utils) {

        class Queue {

            /**
             * @param {IQueueOptions} options
             */
            constructor(options) {
                /**
                 * @type {{change: Signal<Array<IQueueItem>>}}
                 */
                this.signals = utils.liteObject({
                    change: new tsUtils.Signal()
                });
                /**
                 * @type {number}
                 * @private
                 */
                this._queueLimit = options.queueLimit;
                /**
                 * @type {Array<IQueueItem>}
                 * @private
                 */
                this._list = [];
                /**
                 * @type {Array<IQueueItem>}
                 * @private
                 */
                this._activeList = [];
            }

            /**
             * @param {IQueueItem} item
             */
            push(item) {
                const handler = this._getEndPromiseHandler(item);
                item.promise.then(handler, handler);

                if (this._activeList.length === this._queueLimit) {
                    this._list.push(item);
                } else {
                    this._activeList.push(item);
                    this._dispatch();
                }
            }

            /**
             * @return {Array<IQueueItem>}
             */
            getActiveList() {
                return this._activeList.slice();
            }

            /**
             * @private
             */
            _dispatch() {
                this.signals.change.dispatch(this.getActiveList());
            }

            /**
             * @param {IQueueItem} item
             * @return {function()}
             * @private
             */
            _getEndPromiseHandler(item) {
                return () => {
                    [this._list, this._activeList].forEach((list, isActiveList) => {
                        const index = list.indexOf(item);
                        if (index !== -1) {
                            list.splice(index, 1);
                            if (isActiveList) {
                                this._updateActiveList();
                            }
                        }
                    });
                };
            }

            /**
             * @private
             */
            _updateActiveList() {
                if (this._list.length) {
                    const item = this._list.shift();
                    this._activeList.push(item);
                }
                this._dispatch();
            }

        }

        return Queue;
    };

    factory.$inject = ['utils'];

    angular.module('app').factory('Queue', factory);
})();

/**
 * @typedef {object} IQueueOptions
 * @property {number} queueLimit
 */

/**
 * @typedef {object} IQueueItem
 * @property {Promise} promise
 */
