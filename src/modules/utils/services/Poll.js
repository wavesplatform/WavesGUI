(function () {
    'use strict';

    /**
     * @param {State} state
     * @returns {Poll}
     */
    const factory = function (state) {

        class Poll {

            get _time() {
                return this._sleepStep ? this._originTime * this._sleepStep : this._originTime;
            }

            /**
             * @param {Function} getData
             * @param {Function} applyData
             * @param {number} time
             */
            constructor(getData, applyData, time) {
                /**
                 * @type {string}
                 */
                this.id = tsUtils.uniqueId('poll');
                /**
                 * @type {{destroy: Signal}}
                 */
                this.signals = {
                    destroy: new tsUtils.Signal()
                };
                this._removed = false;
                /**
                 * @type {number}
                 * @private
                 */
                this._originTime = time;
                /**
                 * @type {number}
                 * @private
                 */
                this._sleepStep = null;
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

            /**
             * @param {Promise} promise
             */
            pause(promise) {
                this._paused = true;
                this._stopTimers();

                const handler = () => {
                    this._paused = false;
                    this._run();
                };

                promise.then(handler, handler);
            }

            destroy() {
                this._removed = true;
                this._stopTimers();
                this.stopReceive();
                this.signals.destroy.dispatch();
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
             * @param step
             * @private
             */
            _sleep(step) {
                this._sleepStep = step + 2;
            }

            /**
             *
             * @private
             */
            _wakeUp() {
                this._sleepStep = null;
                if (!this._paused) {
                    this.restart();
                }
            }

            /**
             * @private
             */
            _setHandlers() {
                this.receive(state.signals.sleep, this._sleep, this);
                this.receive(state.signals.wakeUp, this._wakeUp, this);
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
                if (this._removed) {
                    return null;
                }
                if (this._paused) debugger;
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
