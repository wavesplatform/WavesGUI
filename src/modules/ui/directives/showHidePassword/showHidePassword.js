(function () {
    'use strict';

    class ShowHidePassword {

        static $inject = ['$element'];

        /**
         * @type {ng.IAugmentedJQuery}
         */
        $element;

        /**
         * @type {ng.IAugmentedJQuery}
         */
        inputEl;

        /**
         * @type {boolean}
         */
        isActive = false;

        constructor($element) {
            this.$element = $element;
        }

        $postLink() {
            this.$element.addClass('show-hide-password');

            this.inputEl = this.$element.find('input');
        }

        toggle() {
            this.isActive = !this.isActive;

            this.inputEl.attr('type', this.isActive ? 'text' : 'password');
        }

    }

    angular.module('app.ui').component('wShowHidePassword', {
        templateUrl: 'modules/ui/directives/showHidePassword/showHidePassword.html',
        controller: ShowHidePassword,
        transclude: true
    });
})();
