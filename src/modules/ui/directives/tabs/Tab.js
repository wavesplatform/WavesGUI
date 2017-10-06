(function () {
    'use strict';

    class Tab {

        constructor() {
            this.selected = false;
        }

        $onInit() {
            this.wTabs.addTab(this);
        }

    }

    angular.module('app.ui').component('wTab', {
        transclude: true,
        template: '<div ng-if="$ctrl.selected" class="tab-tem" ng-transclude></div>',
        controller: Tab,
        require: {
            wTabs: '^wTabs'
        },
        bindings: {
            title: '@',
            id: '@'
        }
    });
})();
