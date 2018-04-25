(function () {
    'use strict';

    /**
     * @param Poll
     * @param {$q} $q
     * @param {EventManager} eventManager
     * @return {PollCache}
     */
    const factory = function (Poll, eventManager) {

        class PollCache {

            /**
             * @param {function} getData
             * @param {number} [timeout]
             * @param {boolean} [isBalance]
             */
            constructor({ getData, timeout, isBalance }) {
                /**
                 * @type {boolean}
                 * @private
                 */
                this._ready = false;
                /**
                 * @type {*}
                 * @private
                 */
                this._data = null;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._isBalance = isBalance;
                /**
                 * @type {Poll}
                 * @private
                 */
                this._poll = new Poll(getData, this._applyData.bind(this), timeout || 5000);
                /**
                 * @type {JQuery.Deferred}
                 * @private
                 */
                this._readyDfr = $.Deferred();

                if (this._isBalance) {
                    this._changeBalanceHandler = () => {
                        this._poll.restart();
                    };
                    eventManager.signals.changeBalanceEvent.on(this._changeBalanceHandler);
                }
            }

            destroy() {
                if (this._isBalance) {
                    eventManager.signals.changeBalanceEvent.off(this._changeBalanceHandler);
                }
                this._poll.destroy();
            }

            get() {
                if (this._ready) {
                    return Promise.resolve(this.data);
                } else {
                    return this._readyDfr.promise();
                }
            }

            /**
             * @param data
             * @private
             */
            _applyData(data) {
                if (!this._ready) {
                    this._readyDfr.resolve(data);
                    this._ready = true;
                    this._readyDfr = null;
                }
                this.data = data;
            }

        }

        return PollCache;
    };

    factory.$inject = ['Poll', 'eventManager'];

    angular.module('app.ui').factory('PollCache', factory);
})();
