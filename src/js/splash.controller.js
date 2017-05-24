(function () {
    'use strict';

    angular
        .module('app.ui')
        .controller('splashController', ['$scope', '$timeout', 'ui.events', function ($scope, $timeout, events) {
            $timeout(function () {
                $scope.$emit(events.SPLASH_COMPLETED);
            }, 1);
        }]);
})();
