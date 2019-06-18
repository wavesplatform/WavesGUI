(function () {
    'use strict';

    const controller = function (Base) {

        class inputHelperController extends Base {

        }

        return new inputHelperController();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wInputHelper', {
        templateUrl: 'modules/ui/directives/inputHelper/inputHelper.html',
        transclude: true,
        controller
    });

})();
