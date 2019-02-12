(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {jQuery} $element
     */
    const controller = function (Base, $element) {

        class ExpandBtn extends Base {

            /**
             * @type {string}
             */
            btnTxt;

            /**
             * @public
             */
            toggleOpen() {
                $element.find('.expand-btn__arrow').toggleClass('up');
            }

        }

        return new ExpandBtn();
    };

    controller.$inject = ['Base', '$element'];

    angular.module('app.ui').component('wExpandBtn', {
        templateUrl: 'modules/ui/directives/expandBtn/expandBtn.html',
        transclude: true,
        bindings: {
            btnTxt: '<'
        },
        controller
    });
})();
