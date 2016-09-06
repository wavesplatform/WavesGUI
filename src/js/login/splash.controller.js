(function () {
    'use strict';

    angular
        .module('app.login')
        .controller('splashController', ['$scope', 'apiService', function ($scope, api) {
            NProgress.start();

            api.blocks.last().then(function (block) {
                NProgress.done();
                //todo: show the next controller
            },
            function (response) {
                NProgress.done();
                //console.log(response.statusCode);
                $scope.connectionFailed = 'Failed connecting to Waves';
            });
        }]);
})();
