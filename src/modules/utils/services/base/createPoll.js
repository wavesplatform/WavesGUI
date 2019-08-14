(function () {
    'use strict';

    /**
     * @param BaseClassComponent
     * @param {Poll} Poll
     * @param {ModalManager} modalManager
     * @param {EventManager} eventManager
     * @param {typeof Base} Base
     * @return {Function}
     */
    const factory = function (BaseClassComponent, Poll, modalManager, eventManager, Base) {

        const pollComponents = Object.create(null);
        const tsUtils = require('ts-utils');

        class PollComponent extends BaseClassComponent {

            constructor(parent) {
                super(parent);
                this._polls = Object.create(null);
                this.receive(modalManager.openModal, this._onOpenModal, this);
            }

            /**
             * @param {Function} getter
             * @param {Function|string} setter
             * @param {number} time
             * @param {ICreatePollOptions} [options]
             * @return {Poll}
             */
            createPoll(getter, setter, time, options) {
                if (typeof setter === 'string') {
                    const name = setter;
                    setter = PollComponent._getSetterHandler(name, this.parent, options);
                } else {
                    setter = PollComponent._wrapSetterHandler(setter, this.parent, options);
                }
                /**
                 * @type {Poll}
                 */
                const poll = new Poll(getter.bind(this.parent), setter, time);
                this._polls[poll.id] = poll;
                if (options && options.isBalance) {
                    this.receive(eventManager.signals.changeBalanceEvent, () => poll.restart());
                }
                this.receiveOnce(poll.signals.destroy, () => {
                    delete this._polls[poll.id];
                });
                return poll;
            }

            remove() {
                super.remove();
                delete pollComponents[this.parent.cid];
                tsUtils.each(this._polls, (poll) => {
                    if (poll) {
                        poll.destroy();
                    }
                });
            }

            /**
             * @private
             */
            _onOpenModal(modal) {
                tsUtils.each(this._polls, (poll) => {
                    poll.pause(modal);
                });
            }

            /**
             * @param {Base} base
             * @param {IPollGetter} getter
             * @param {IPollSetter} setter
             * @param {number} time
             * @param {ICreatePollOptions} [options]
             * @return {Poll}
             */
            static create(base, getter, setter, time, options) {
                if (!(base instanceof Base)) {
                    throw new Error('Component must be an instance of Base');
                }

                if (base.wasDestroed) {
                    return null;
                }

                const poll = PollComponent._getPoll(base)
                    .createPoll(getter, setter, time, options);

                base.signals.logout.once(poll.destroy, poll);

                return poll;
            }

            /**
             * @param {string} path
             * @param {Base} parent
             * @param {ICreatePollOptions} options
             * @private
             */
            static _getSetterHandler(path, parent, options) {
                if (options && options.$scope) {
                    return function (data) {
                        tsUtils.set(parent, path, data);
                        options.$scope.$apply();
                    };
                } else {
                    return function (data) {
                        tsUtils.set(parent, path, data);
                    };
                }
            }

            /**
             * @param {function} handler
             * @param {Base} parent
             * @param {ICreatePollOptions} options
             * @private
             */
            static _wrapSetterHandler(handler, parent, options) {
                if (options && options.$scope) {
                    return function (data) {
                        handler.call(parent, data);
                        options.$scope.$apply();
                    };
                } else {
                    return handler.bind(parent);
                }
            }

            /**
             * @param {Base} base
             * @return {PollComponent}
             * @private
             */
            static _getPoll(base) {
                if (pollComponents[base.cid]) {
                    return pollComponents[base.cid];
                }
                const poll = new PollComponent(base);
                pollComponents[base.cid] = poll;
                return poll;
            }

        }

        return PollComponent.create;
    };

    factory.$inject = ['BaseClassComponent', 'Poll', 'modalManager', 'eventManager', 'Base'];

    angular.module('app.utils')
        .factory('createPoll', factory);

})();

/**
 * @typedef {object} ICreatePollOptions
 * @property {boolean} [isBalance]
 * @property {$rootScope.Scope} [$scope]
 */

/**
 * @typedef {function():*} IPollGetter
 */

/**
 * @typedef {string|function(data: *): *} IPollSetter
 */

/**
 * @typedef {function} IPollCreate
 * @param {Base} base
 * @param {IPollGetter} getter
 * @param {IPollSetter} setter
 * @param {number} time
 * @param {ICreatePollOptions} [options]
 * @return {Poll}
 */
