(function () {
    'use strict';

    /**
     * @param $mdToast
     * @param {app.i18n} i18n
     * @returns {NotificationsManager}
     */
    const factory = function ($mdToast, i18n) {

        // TODO : make it custom, without Material Design

        class NotificationsManager {

            constructor() {
                this.queue = [];
                this.promise = Promise.resolve();
            }


            /**
             * @param {object} msg
             * @param {number} [delay]
             */
            info(msg, delay) {
                this._create('info', msg.literal, msg.ns, msg.params, delay);
            }

            /**
             * @param {object} msg
             * @param {number} [delay]
             */
            warn(msg, delay) {
                this._create('warn', msg.literal, msg.ns, msg.params, delay);
            }

            /**
             * @param {object} msg
             * @param {number} [delay]
             */
            error(msg, delay) {
                this._create('error', msg.literal, msg.ns, msg.params, delay);
            }

            /**
             * @param {string} type
             * @param {string} literal
             * @param {string} ns
             * @param {object} params
             * @param {number} [delay]
             * @private
             */
            _create(type, literal, ns, params, delay = 3000) {
                // TODO : create elements with $compile
                const message = i18n.translate(literal, ns, params);
                const toast = $mdToast.simple()
                    .position('bottom right')
                    .textContent(message)
                    .toastClass(type)
                    .hideDelay(delay);
                this.queue.push(toast);
                this._show();
            }

            /**
             * @private
             */
            _show() {
                if (this.queue.length) {
                    const toast = this.queue.shift();
                    this.promise = this.promise.then(() => {
                        return $mdToast.show(toast).then(() => this._show());
                    });
                }
            }

        }

        return new NotificationsManager();
    };

    factory.$inject = ['$mdToast', 'i18n'];

    angular.module('app.utils').factory('notificationsManager', factory);
})();
