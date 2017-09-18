(function () {
    'use strict';

    const factory = function () {

        class AppEvent {

            constructor(data, promise) {
                /**
                 * @type {Signal}
                 */
                this.end = new tsUtils.Signal();
                /**
                 * @type {Signal}
                 */
                this.change = new tsUtils.Signal();
            }

        }

        return AppEvent;
    };

    factory.$inject = [];

    angular.module('app.ui')
        .factory('appEvent', factory);
})();
