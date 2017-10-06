(function () {
    'use strict';

    angular.module('app.ui')
        .component('wTHead', {
            require: {
                table: '^wTable'
            },
            transclude: true,
            template: '<div ng-transclude class="table-thead"></div>'
        });
})();
