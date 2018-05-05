(function () {
    'use strict';

    /**
     * @param BaseClassComponent
     * @param {Poll} Poll
     * @param {ModalManager} modalManager
     * @param {EventManager} eventManager
     * @return {Function}
     */
    const factory = function (BaseClassComponent, Poll, modalManager, eventManager) {

        const pollComponents = Object.create(null);

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
                    setter = (data) => {
                        tsUtils.set(this.parent, name, data);
                        if (options && options.$scope) {
                            options.$scope.$apply();
                        }
                    };
                } else {
                    setter = setter.bind(this.parent);
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
                return PollComponent._getPoll(base)
                    .createPoll(getter, setter, time, options);
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

    factory.$inject = ['BaseClassComponent', 'Poll', 'modalManager', 'eventManager'];

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
