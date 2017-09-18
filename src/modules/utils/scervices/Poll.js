(function () {
    'use strict';

    const factory = function () {

        class Poll {

            constructor(getData, applyData, time) {
                /**
                 * @private
                 * @type {number}
                 */
                this.time = time;
                /**
                 * @private
                 * @type {number}
                 */
                this.waitTimer = null;
                /**
                 * @private
                 * @type {Function}
                 */
                this.getData = getData;
                /**
                 * @private
                 * @type {Function}
                 */
                this.applyData = applyData;
                /**
                 * @private
                 * @type {{canPlay: boolean}}
                 */
                this.promiseControl = null;

                this._run();
            }

            destroy() {
                this._stopTimers();
            }

            restart() {
                this._stopTimers();
                this._run();
            }

            /**
             * @private
             */
            _stopTimers() {
                if (this.waitTimer) {
                    clearTimeout(this.waitTimer);
                    this.waitTimer = null;
                }
                if (this.promiseControl) {
                    this.promiseControl.canPlay = false;
                    this.promiseControl = null;
                }
            }

            /**
             * @private
             */
            _run() {
                const result = this.getData();
                if (Poll._isPromise(result)) {
                    result.then(this._wrapCallback((data) => {
                        this.applyData(data);
                        this._addTimeout();
                    }, { canPlay: true }));
                } else {
                    this.applyData(result);
                    this._addTimeout();
                }
            }

            /**
             * @private
             */
            _addTimeout() {
                this._stopTimers();
                this.waitTimer = setTimeout(() => {
                    this.waitTimer = null;
                    this._run();
                }, this.time);
            }

            /**
             * @param cb
             * @param control
             * @return {Function}
             * @private
             */
            _wrapCallback(cb, control) {
                this._stopTimers();
                this.promiseControl = control;
                return function (data) {
                    if (control.canPlay) {
                        cb(data);
                    }
                };
            }

            /**
             * @param data
             * @return {boolean}
             * @private
             */
            static _isPromise(data) {
                return data && data.then && typeof data.then === 'function';
            }

        }

        return Poll;
    };

    factory.$inject = [];

    angular.module('app.utils')
        .factory('Poll', factory);
})();
