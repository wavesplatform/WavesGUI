(function () {
    'use strict';

    /**
     * @param {State} state
     * @param {typeof PromiseControl} PromiseControl
     * @returns {Poll}
     */
    const factory = function (state, PromiseControl) {

        class Poll {

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
                 * @type {number}
                 * @private
                 */
                this._lastStart = null;
                /**
                 * @type {number}
                 * @private
                 */
                this._lastEndPromise = null;
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
                this._promise = null;

                this._initialize();
            }

            /**
             * @param {Promise} promise
             */
            pause(promise) {
                this._paused = true;
                this._stopTimers();

                const handler = this.play.bind(this);
                promise.then(handler, handler);
            }

            stop() {
                this._paused = true;
                this._stopTimers();
            }

            play() {
                this._paused = false;
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
                Poll._removePoll(this);
                this._promise = null;
            }

            /**
             * @private
             */
            _run() {
                if (this._removed) {
                    return null;
                }
                if (this._paused) throw new Error('Run form pause!'); // TODO remove after debug

                const time = Date.now();
                this._lastStart = time;
                this._lastEndPromise = null;
                const result = this._getData();
                if (Poll._isPromise(result)) {
                    this._promise = new PromiseControl(result);
                    this._promise.always((data) => {
                        this._lastEndPromise = Date.now();
                        this._applyData(data);
                        this._addTimeout();
                    });
                } else {
                    this._lastEndPromise = time;
                    this._applyData(result);
                    this._addTimeout();
                }
            }

            /**
             * @private
             */
            _addTimeout() {
                Poll._addPoll(this);
            }

            /**
             * @param data
             * @return {boolean}
             * @private
             */
            static _isPromise(data) {
                return data && data.then && typeof data.then === 'function';
            }

            /**
             * @param {Poll} poll
             * @private
             */
            static _addPoll(poll) {
                if (!Poll._polls[poll.id]) {
                    Poll._polls[poll.id] = poll;
                    if (Object.keys(Poll._polls).length === 1) {
                        this._startPollTimer();
                    }
                }
            }

            /**
             * @param {Poll} poll
             * @private
             */
            static _removePoll(poll) {
                delete Poll._polls[poll.id];
            }

            /**
             * @private
             */
            static _startPollTimer() {
                if (Poll._timer) {
                    clearTimeout(Poll._timer);
                    Poll._timer = null;
                }

                Poll._timer = setTimeout(() => {
                    Poll._timer = null;
                    const time = Date.now();

                    Object.keys(Poll._polls).forEach((key) => {
                        const poll = Poll._polls[key];

                        if (!poll._lastEndPromise) {
                            return null;
                        }
                        if (time - poll._lastEndPromise > poll._time) {
                            poll._run();
                        }
                    });
                    if (Object.keys(Poll._polls).length) {
                        Poll._startPollTimer();
                    }
                }, 500);
            }

        }

        /**
         * @type {object}
         * @private
         */
        Poll._polls = Object.create(null);
        /**
         * @type {number}
         * @private
         */
        Poll._timer = null;

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

    factory.$inject = ['state', 'PromiseControl'];

    angular.module('app.utils')
        .factory('Poll', factory);
})();
