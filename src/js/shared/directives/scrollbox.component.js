(function () {
    'use strict';

    function ScrollboxController() {}

    angular
        .module('app.shared')
        .component('wavesScrollbox', {
            controller: ScrollboxController,
            transclude: true,
            template: '<div ng-transclude></div>'
        });
})();
