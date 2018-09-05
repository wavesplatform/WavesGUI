(function () {
    'use strict';

    angular.module('app.ui').component('wDesktopOnly', {
        scope: false,
        transclude: true,
        template: `<div ng-if="::${WavesApp.isDesktop()}" ng-transclude></div>`
    });

})();
