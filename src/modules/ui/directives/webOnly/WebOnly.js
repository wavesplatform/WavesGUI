(function () {
    'use strict';

    angular.module('app.ui').component('wWebOnly', {
        scope: false,
        transclude: true,
        template: `<div ng-if="::${WavesApp.isWeb()}" ng-transclude></div>`
    });

})();
