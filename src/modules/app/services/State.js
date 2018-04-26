(function () {
    'use strict';

    /**
     * @param {TimeLine} timeLine
     * @param {$injector} $injector
     * @return {State}
     */
    const factory = function (timeLine, $injector) {

        const tsUtils = require('ts-utils');

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
                 * @type {IStateSignals}
                 */
                this.signals = {
                    window: {
                        blur: new tsUtils.Signal(),
                        focus: new tsUtils.Signal()
                    },
                    sleep: new tsUtils.Signal(),
                    wakeUp: new tsUtils.Signal(),
                    changeRouterStateSuccess: new tsUtils.Signal(),
                    changeRouterStateStart: new tsUtils.Signal()
                };
                /**
                 * @type {string}
                 */
                this.lastOpenVersion = '';

                /**
                 * @type {PromiseControl}
                 * @private
                 */
                this._timer = null;
                /**
                 * @type {number}
                 * @private
                 */
                this._seepStartTime = null;
                /**
                 * @type {number}
                 * @private
                 */
                this._maxSleep = null;
                /**
                 * @type {number}
                 * @private
                 */
                this.__sleepStep = null;
                /**
                 * @type {HTMLElement}
                 * @private
                 */
                this._block = document.createElement('DIV');
                /**
                 * @type {Object.<function>}
                 * @private
                 */
                this._handlers = Object.create(null);

                timeLine.wait(100).then(() => {
                    /**
                     * @type {User}
                     */
                    const user = $injector.get('user');
                    user.onLogin().then(() => {
                        this._maxSleep = user.getSetting('logoutAfterMin');
                        user.changeSetting.on((path) => {
                            if (path === 'logoutAfterMin') {
                                this._maxSleep = user.getSetting('logoutAfterMin');
                            }
                        });
                    });
                });

                this._initialize();
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
                    this.signals.window.focus.dispatch();
                    this._wakeUp();
                };
                this._handlers.blur = () => {
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
                    const sleepMinutes = Math.floor(time / (1000 * 60));
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

    factory.$inject = ['timeLine', '$injector'];

    angular.module('app')
        .factory('state', factory);
})();

/**
 * @typedef {Object} IStateSignals
 * @property {object} window
 * @property {Signal} window.blur
 * @property {Signal} window.focus
 * @property {Signal} sleep
 * @property {Signal} wakeUp
 * @property {Signal} changeRouterStateSuccess
 * @property {Signal} changeRouterStateStart
 */
