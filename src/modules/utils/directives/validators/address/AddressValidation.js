(function () {
    'use strict';

    /**
     * @param {app.utils.apiWorker} apiWorker
     */
    const validator = function (apiWorker) {
        return {
            require: 'ngModel',
            /**
             * @param {$rootScope.Scope} $scope
             * @param {object} {JQuery} $input
             * @param $attrs
             * @param {ngModel.NgModelController} $ngModel
             */
            link: function ($scope, $input, $attrs, $ngModel) {
                $ngModel.$asyncValidators.inputAddress = function (address) {
                    return apiWorker.process((WavesApi, address) => {
                        return WavesApi.API.Node.v1.addresses.balance(address)
                            .then((data) => {
                                if (data && data.balance != null) {
                                    return Promise.resolve();
                                } else {
                                    return Promise.reject();
                                }
                            }, (e) => {
                                return Promise.reject(e.message);
                            });
                    }, address);
                };
            }
        };
    };

    validator.$inject = ['apiWorker'];

    angular.module('app.utils')
        .directive('inputAddress', validator);
})();
