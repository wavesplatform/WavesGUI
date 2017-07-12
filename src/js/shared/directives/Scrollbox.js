(function () {
    'use strict';

    function Scrollbox() {}

    angular
        .module('app.shared')
        .component('wavesScrollbox', {
            controller: Scrollbox,
            transclude: true,
            template: '<div ng-transclude></div>'
        });
})();
