(function () {
    'use strict';

    const factory = function (BaseClassComponent, Poll) {

        const polls = Object.create(null);

        class PollComponent extends BaseClassComponent {

            constructor(data) {
                super(data);
                this._polls = Object.create(null);
            }

            /**
             * @param {Function} getter
             * @param {Function|string} setter
             * @param {number} time
             * @returns {Poll}
             */
            createPoll(getter, setter, time) {
                if (typeof setter === 'string') {
                    const name = setter;
                    setter = (data) => {
                        tsUtils.set(this.parent, name, data);
                    };
                } else {
                    setter = setter.bind(this.parent);
                }
                /**
                 * @type {Poll}
                 */
                const poll = new Poll(getter.bind(this.parent), setter, time);
                this._polls[poll.id] = poll;
                this.receiveOnce(poll.signals.destroy, () => {
                    delete this._polls[poll.id];
                });
                return poll;
            }

            remove() {
                super.remove();
                delete polls[this.parent.cid];
                tsUtils.each(this._polls, (poll) => {
                    if (poll) {
                        poll.destroy();
                    }
                });
            }

            /**
             * @param {Base} base
             * @param {Function} getter
             * @param {Function|string} setter
             * @param {number} time
             * @returns {Poll}
             */
            static create(base, getter, setter, time) {
                return PollComponent._getPoll(base)
                    .createPoll(getter, setter, time);
            }

            /**
             * @param {Base} base
             * @returns {PollComponent}
             * @private
             */
            static _getPoll(base) {
                if (polls[base.cid]) {
                    return polls[base.cid];
                }
                const poll = new PollComponent(base);
                polls[base.cid] = poll;
                return poll;
            }

        }

        /**
         * @param {Base} base
         * @param {Function} getter
         * @param {Function|string} setter
         * @param {number} time
         * @returns {Poll}
         */
        return function (base, getter, setter, time) {
            return PollComponent.create(base, getter, setter, time);
        };
    };

    factory.$inject = ['BaseClassComponent', 'Poll'];

    angular.module('app.utils')
        .factory('createPoll', factory);

})();
