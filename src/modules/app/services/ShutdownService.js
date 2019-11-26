(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {IPollCreate} createPoll
     * @param {ConfigService} configService
     * @param {ModalManager} modalManager
     * @return {ShutdownService}
     */
    const factory = function (Base, createPoll, configService, modalManager) {

        class ShutdownService extends Base {

            /**
             * @private
             */
            _timeOutTimerId;

            /**
             * @public
             */
            run() {
                this._handleTimers(this._getTimers());
                window.clearTimeout(this._timeOutTimerId);
                this._timeOutTimerId = setTimeout(() => this.run(), 1000);
            }

            /**
             * @return {*}
             * @private
             */
            _getTimers() {
                return configService.get('SHUTDOWN_NOTIFICATION_TIMERS') || [];
            }

            /**
             * @param {[{ start: string, end: ?string, action: string }]} timers
             * @private
             */
            _handleTimers(timers) {
                const now = Date.now();

                timers.forEach(timer => {
                    const start = new Date(timer.start).getTime();
                    const end = timer.end ? new Date(timer.end).getTime() : Date.now();

                    if (now >= start && now <= end) {
                        if (!sessionStorage.getItem(timer.action)) {
                            sessionStorage.setItem(timer.action, 'true');
                            modalManager[timer.action]();
                        }
                    }
                });
            }

        }

        return new ShutdownService();
    };

    factory.$inject = ['Base', 'createPoll', 'configService', 'modalManager'];

    angular.module('app').factory('shutdownService', factory);
})();

/**
 * @name ShutdownService
 */
