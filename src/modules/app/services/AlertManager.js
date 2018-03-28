(function () {
    'use strict';

    const ALERTS_LIMIT = 2;

    /**
     * @param {app.utils} utils
     * @param {Queue} Queue
     * @return {AlertManager}
     */
    const factory = function (utils, Queue) {

        class AlertManager {

            constructor() {
                /**
                 * @type {Queue}
                 * @private
                 */
                this._queue = new Queue({ queueLimit: ALERTS_LIMIT });
                /**
                 * @type {{change: Signal<Array<IQueueItem>>}}
                 */
                this.signals = utils.liteObject({
                    change: new tsUtils.Signal()
                });
            }

            /**
             * @param {IAlertDataObject} alertDataObj
             * @param {number} [delay]
             */
            info(alertDataObj, delay) {
                this._push('info', alertDataObj, delay);
            }

            /**
             * @param {IAlertDataObject} alertDataObj
             * @param {number} [delay]
             */
            success(alertDataObj, delay) {
                this._push('success', alertDataObj, delay);
            }

            /**
             * @param {IAlertDataObject} alertDataObj
             * @param {number} [delay]
             */
            warn(alertDataObj, delay) {
                this._push('warn', alertDataObj, delay);
            }

            /**
             * @param {IAlertDataObject} alertDataObj
             * @param {number} [delay]
             */
            error(alertDataObj, delay) {
                this._push('error', alertDataObj, delay);
            }

            /**
             * @param type
             * @param alertDataObj
             * @param delay
             * @private
             */
            _push(type, alertDataObj, delay = -1) {

            }

        }

        return new AlertManager();
    };

    factory.$inject = ['utils', 'Queue'];

    angular.module('app').factory('alertManager', factory);
})();

/**
 * @typedef {object} IAlertDataObject
 * @property {string} ns
 */
