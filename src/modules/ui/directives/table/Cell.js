(function () {
    'use strict';

    angular.module('app.ui')
        .component('wCell', {
            require: {
                row: '^wRow'
            },
            transclude: true,
            template: '<div ng-transclude class="table-cell"></div>'
        });
})();
