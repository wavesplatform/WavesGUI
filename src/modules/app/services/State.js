(function () {
    'use strict';

    /**
     * @param {TimeLine} timeLine
     * @return {State}
     */
    const factory = function (timeLine) {

        class State {

            /**
             * @return {number}
             * @private
             */
            get _sleepStep() {
                return this.__sleepStep;
            }

            /**
             * @param {number} value
             * @private
             */
            set _sleepStep(value) {
                if (value) {
                    if (this._maxSleep) {
                        this._addBlock();
                    }
                } else {
                    this._removeBlock();
                }
                this.__sleepStep = value;
            }

            constructor() {
                /**
                 * @type {boolean}
                 */
                this.windowStateFocus = true;

                /**
                 * @type {{window: {blur: Signal, focus: Signal}, sleep: Signal, wakeUp: Signal, changeRouterState: Signal}}
                 */
                this.signals = {
                    window: {
                        blur: new tsUtils.Signal(),
                        focus: new tsUtils.Signal()
                    },
                    sleep: new tsUtils.Signal(),
                    wakeUp: new tsUtils.Signal(),
                    changeRouterState: new tsUtils.Signal()
                };

                this._timer = null;
                this._seepStartTime = null;
                this._maxSleep = null;
                this.__sleepStep = null;
                this._block = document.createElement('DIV');
                this._handlers = Object.create(null);

                this._initialize();
            }

            setMaxSleep(max) {
                this._maxSleep = max;
            }

            /**
             * @private
             */
            _initialize() {
                this._addBlockStyles();
                this._createHandlers();
                this._setHandlers();
            }

            /**
             * @private
             */
            _addBlockStyles() {
                this._block.classList.add('sleep-block');
            }

            /**
             * @private
             */
            _createHandlers() {
                this._handlers.focus = () => {
                    this.windowStateFocus = true;
                    this.signals.window.focus.dispatch();
                    this._wakeUp();
                };
                this._handlers.blur = () => {
                    this.windowStateFocus = false;
                    this.signals.window.blur.dispatch();
                    this._sleep();
                };
            }

            /**
             * @private
             */
            _wakeUp() {
                this._seepStartTime = null;
                this._sleepStep = null;
                if (this._timer) {
                    timeLine.cancel(this._timer);
                    this._timer = null;
                }
                this.signals.wakeUp.dispatch();
            }

            /**
             * @private
             */
            _removeBlock() {
                if (this._block && this._block.parentNode === document.body) {
                    document.body.removeChild(this._block);
                }
            }

            /**
             * @private
             */
            _addBlock() {
                if (this._block && !this._block.parentNode) {
                    document.body.appendChild(this._block);
                }
            }

            /**
             * @private
             */
            _sleep() {
                if (this._timer) {
                    timeLine.cancel(this._timer);
                    this._timer = null;
                }
                if (!this._seepStartTime) {
                    this._seepStartTime = Date.now();
                    this._setSleepStep(0);
                }
                this._timer = timeLine.timeout(() => {
                    this._timer = null;
                    const time = Date.now() - this._seepStartTime;
                    const sleepMinutes = Math.floor(time / (1000 * 60 * 5));
                    this._setSleepStep(sleepMinutes);
                    this._sleep();
                }, 1000);
            }

            /**
             * @param step
             * @return {null}
             * @private
             */
            _setSleepStep(step) {
                if (this._sleepStep === step) {
                    return null;
                }
                this._sleepStep = step;
                if (this._maxSleep) {
                    this._block.style.opacity = this._sleepStep * (1 / this._maxSleep);
                }
                this.signals.sleep.dispatch(this._sleepStep);
            }

            /**
             * @private
             */
            _setHandlers() {
                Object.keys(this._handlers)
                    .forEach((event) => {
                        window.addEventListener(event, this._handlers[event], false);
                    });
            }
        }

        return new State();
    };

    factory.$inject = ['timeLine'];

    angular.module('app')
        .factory('state', factory);
})();
