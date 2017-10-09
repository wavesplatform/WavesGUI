(function () {
    'use strict';

    const origin = angular.module;
    angular.module = function (...args) {
        const [name] = args;
        if (WavesApp.modules.indexOf(name) === -1) {
            WavesApp.modules.push(name);
        }
        return origin.call(angular, ...args);
    };

    angular.module('app', [
        'ngMaterial',
        'ui.router',
        'ui.router.state.events',
        'n3-line-chart',

        'app.utils',
        'app.ui',
        'app.welcome',
        'app.auth',
        'app.wallet',
        'app.dex'
    ]);
})();
