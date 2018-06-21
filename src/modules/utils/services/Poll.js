(function () {
    'use strict';

    /**
     * @param {State} state
     * @param {typeof PromiseControl} PromiseControl
     * @param {TimeLine} timeLine
     * @param {app.utils} utils
     * @param {$q} $q
     * @return {Poll}
     */
    const factory = function (state, PromiseControl, timeLine, utils, $q) {

        class Poll {

            /**
             * @returns {Promise}
             */
            get ready() {
                return this._ready.promise;
            }

            /**
             * @return {number}
             * @private
             */
            get _time() {
                return this._sleepStep ? this._originTime * this._sleepStep : this._originTime;
            }

            /**
             * @return {PromiseControl}
             * @private
             */
            get _promise() {
                return this.__promise;
            }

            /**
             * @param {PromiseControl} promise
             * @private
             */
            set _promise(promise) {
                if (this.__promise) {
                    this.__promise.drop();
                }
                this.__promise = promise;
            }

            /**
             * @param {Function} getData
             * @param {Function} applyData
             * @param {number} time
             * @param {number} [errorRequestTime]
             */
            constructor(getData, applyData, time, errorRequestTime) {
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
                /**
                 * @type {number}
                 * @private
                 */
                this._errorRequestTime = errorRequestTime || 1000;
                /**
                 * @type {Deferred}
                 */
                this._ready = $q.defer();
                /**
                 * @type {boolean}
                 * @private
                 */
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
                 * @type {Function}
                 */
                this._getData = getData;
                /**
                 * @private
                 * @type {Function}
                 */
                this._applyData = applyData;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._paused = false;
                /**
                 * @type {PromiseControl}
                 * @private
                 */
                this._timer = null;
                /**
                 * @type {PromiseControl}
                 * @private
                 */
                this._promise = null;
                /**
                 * @type {PromiseControl}
                 * @private
                 */
                this._pausePromise = null;

                this._initialize();
            }

            /**
             * @param {Promise} promise
             */
            pause(promise) {
                this._paused = true;
                this._stopTimers();

                if (this._pausePromise) {
                    this._pausePromise.drop();
                    const pausePromise = utils.resolve(this._pausePromise.promise()).then(() => promise);
                    this._pausePromise = new PromiseControl(pausePromise);
                } else {
                    this._pausePromise = new PromiseControl(promise);
                }

                const handler = () => {
                    this._pausePromise = null;
                    this.play();
                };
                this._pausePromise.always(handler);
            }

            stop() {
                this._paused = true;
                this._stopTimers();
            }

            play() {
                this._paused = false;
                if (this._pausePromise) {
                    this._pausePromise.drop();
                    this._pausePromise = null;
                }
                this._run();
            }

            destroy() {
                this._removed = true;
                this._stopTimers();
                this.stopReceive();
                this.signals.destroy.dispatch();
            }

            restart() {
                this._stopTimers();
                return this._run();
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
                timeLine.cancel(this._timer);
                this._promise = null;
            }

            /**
             * @private
             */
            _run() {
                return new Promise((resolve) => {
                    if (this._removed) {
                        return null;
                    }
                    if (this._paused) {
                        return null;
                    }

                    const result = this._getData();
                    if (Poll._isPromise(result)) {
                        this._promise = new PromiseControl(result);
                        this._promise.then((data) => {
                            this._addTimeout();
                            this._applyData(data);
                            this._ready.resolve();
                            resolve();
                        }, () => {
                            this._timer = timeLine.timeout(() => this._run(), this._errorRequestTime);
                        });
                    } else {
                        this._applyData(result);
                        this._addTimeout();
                        resolve();
                    }
                });
            }

            /**
             * @private
             */
            _addTimeout() {
                this._timer = timeLine.timeout(() => this._run(), this._time);
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

    factory.$inject = ['state', 'PromiseControl', 'timeLine', 'utils', '$q'];

    angular.module('app.utils')
        .factory('Poll', factory);
})();
