(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @return {UnavailableCtrl}
     */
    const controller = function (Base) {

        class UnavailableCtrl extends Base {


        }

        return new UnavailableCtrl();
    };

    controller.$inject = ['Base'];

    angular.module('app.unavailable').controller('UnavailableCtrl', controller);
})();
