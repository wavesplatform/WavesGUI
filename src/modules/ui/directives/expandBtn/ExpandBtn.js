(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     */
    const controller = function (Base) {

        class ExpandBtn extends Base {

            /**
             * @type {string}
             */
            btnTxt;

            /**
             * @type {boolean}
             */
            isUp;

            /**
             * @public
             */
            toggleOpen() {
                this.isUp = !this.isUp;
            }

        }

        return new ExpandBtn();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wExpandBtn', {
        templateUrl: 'modules/ui/directives/expandBtn/expandBtn.html',
        transclude: true,
        bindings: {
            btnTxt: '<',
            isUp: '<'
        },
        controller
    });
})();
