(function () {
    'use strict';

    /**
     * @param {State} state
     * @returns {Poll}
     */
    const factory = function (state) {

        class Poll {

            /**
             * @param {Function} getData
             * @param {Function} applyData
             * @param {number} time
             */
            constructor(getData, applyData, time) {
                /**
                 * @private
                 * @type {number}
                 */
                this._time = time;
                /**
                 * @private
                 * @type {number}
                 */
                this._waitTimer = null;
                /**
                 * @private
                 * @type {Function}
                 */
                this._getData = getData;
                /**
                 * @private
                 * @type {Function}
                 */
                this._applyData = applyData;
                /**
                 * @private
                 * @type {{canPlay: boolean}}
                 */
                this._promiseControl = null;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._paused = false;

                this._initialize();
            }

            pause() {
                if (!this._paused) {
                    this._stopTimers();
                    this._paused = true;
                }
            }

            play() {
                if (this._paused) {
                    this._run();
                    this._paused = false;
                }
            }

            destroy() {
                this._stopTimers();
                this.stopReceive();
            }

            restart() {
                this._stopTimers();
                this._run();
            }

            /**
             * @private
             */
            _initialize() {
                this._setHandlers();
                this._run();
            }

            /**
             * @private
             */
            _setHandlers() {
                this.receive(state.signals.window.blur, this.pause, this);
                this.receive(state.signals.window.focus, this.play, this);
            }

            /**
             * @private
             */
            _stopTimers() {
                if (this._waitTimer) {
                    clearTimeout(this._waitTimer);
                    this._waitTimer = null;
                }
                if (this._promiseControl) {
                    this._promiseControl.canPlay = false;
                    this._promiseControl = null;
                }
            }

            /**
             * @private
             */
            _run() {
                const result = this._getData();
                if (Poll._isPromise(result)) {
                    result.then(this._wrapCallback((data) => {
                        this._applyData(data);
                        this._addTimeout();
                    }, { canPlay: true }));
                } else {
                    this._applyData(result);
                    this._addTimeout();
                }
            }

            /**
             * @private
             */
            _addTimeout() {
                this._stopTimers();
                this._waitTimer = setTimeout(() => {
                    this._waitTimer = null;
                    this._run();
                }, this._time);
            }

            /**
             * @param cb
             * @param control
             * @return {Function}
             * @private
             */
            _wrapCallback(cb, control) {
                this._stopTimers();
                this._promiseControl = control;
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

        /**
         * @access protected
         * @type {*|<T, R>(signal: Signal<T>, handler: Signal.IHandler<T, R>, context?: R) => void}
         */
        Poll.prototype.receive = tsUtils.Receiver.prototype.receive;
        /**
         * @access protected
         * @type {*|<T, R>(signal: Signal<T>, handler: Signal.IHandler<T, R>, context?: R) => void}
         */
        Poll.prototype.receiveOnce = tsUtils.Receiver.prototype.receiveOnce;
        /**
         * @access protected
         * @type {*|((item?: TStopArg1, handler?: Signal.IHandler<any, any>) => void)}
         */
        Poll.prototype.stopReceive = tsUtils.Receiver.prototype.stopReceive;

        return Poll;
    };

    factory.$inject = ['state'];

    angular.module('app.utils')
        .factory('Poll', factory);
})();
