(function () {
    'use strict';

    angular
        .module('app.ui')
        .controller('splashController', ['$scope', 'apiService', 'ui.events', function ($scope, api, events) {
            NProgress.start();

            var splash = this;

            api.blocks.last().then(function (block) {
                NProgress.done();
                $scope.$emit(events.SPLASH_COMPLETED);
            },
            function (response) {
                NProgress.done();
                splash.connectionFailed = 'Failed connecting to Waves';
            });
        }]);
})();
