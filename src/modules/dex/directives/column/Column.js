(function () {
    'use strict';

    const controller = function (Base) {

        class Column extends Base {

            constructor() {
                super();
                this.opened = true;
            }

            $postLink() {

            }

        }

        return new Column();
    };

    controller.$inject = ['Base'];

    angular.module('app.dex').component('wColumn', {
        bindings: {},
        template: '<div ng-transclude></div><div ng-class="{hide: $ctrl.opened}" class="control"></div> ',
        transclude: true,
        controller
    });
})();
