(function () {
    'use strict';

    const analytics = require('@waves/event-sender');

    /**
     * @param {typeof Base} Base
     */
    const directive = Base => ({
        priority: 100000,
        scope: {
            eventTarget: '<',
            event: '<',
            eventParams: '<'
        },
        restrict: 'AE',
        /**
         * @param {$rootScope.Scope & {event: string, eventTarget: string, eventParams: *}} $scope
         * @param {JQuery} $element
         * @return {Analytics}
         */
        controller: ($scope, $element) => {

            class Analytics extends Base {

                /**
                 * @type {Function}
                 */
                handler;


                $postLink() {
                    this.handler = () => {
                        if (!$scope.event) {
                            return null;
                        }
                        analytics.send({
                            name: $scope.event,
                            target: $scope.eventTarget,
                            params: $scope.eventParams
                        });
                    };
                    this.listenEventEmitter($element, 'click', this.handler);
                }

            }

            return new Analytics();
        }
    });
    directive.$inject = ['Base'];

    angular.module('app.utils').directive('wAnalytics', directive);
})();
