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
             * @public
             */
            run() {
                createPoll(this, this._getDates, this._handleDates, 1000);
            }

            _getDates() {
                return configService.get('SHUTDOWN_NOTIFICATION_TIMERS');
            }

            _handleDates(timers) {
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
