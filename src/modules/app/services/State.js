(function () {
    'use strict';

    const factory = function () {

        class State {

            constructor() {
                /**
                 * @type {boolean}
                 */
                this.windowStateFocus = true;
                /**
                 * @type {{window: {blur: Signal, focus: Signal}}}
                 */
                this.signals = {
                    window: {
                        blur: new tsUtils.Signal(),
                        focus: new tsUtils.Signal()
                    }
                };

                this._handlers = Object.create(null);

                this._initialize();
            }

            _initialize() {
                this._createHandlers();
                this._setHandlers();
            }

            _createHandlers() {
                this._handlers.focus = () => {
                    this.windowStateFocus = true;
                    this.signals.window.focus.dispatch();
                };
                this._handlers.blur = () => {
                    this.windowStateFocus = false;
                    this.signals.window.blur.dispatch();
                };
            }

            _setHandlers() {
                Object.keys(this._handlers)
                    .forEach((event) => {
                        window.addEventListener(event, this._handlers[event], false);
                    });
            }
        }

        return new State();
    };

    factory.$inject = [];

    angular.module('app')
        .factory('state', factory);
})();
