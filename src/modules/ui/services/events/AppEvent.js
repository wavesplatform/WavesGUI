(function () {
    'use strict';

    const factory = function () {

        /**
         * @class AppEvent
         */
        class AppEvent {

            /**
             * @memberOf AppEvent#
             * @abstract
             * @returns {Promise}
             */
            getStatus() {

            }

        }

        /**
         * @memberof AppEvent
         * @static
         * @type {{SUCCESS: string, PENDING: string, ERROR: string}}
         */
        AppEvent.statuses = {
            SUCCESS: 'success',
            PENDING: 'pending',
            ERROR: 'error'
        };

        return AppEvent;
    };

    factory.$inject = [];

    angular.module('app.ui')
        .factory('AppEvent', factory);
})();
