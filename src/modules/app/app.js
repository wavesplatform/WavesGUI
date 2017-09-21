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

    const app = angular.module('app', [
        'ngMaterial',
        'ngMessages',
        'ui.router',
        'ui.router.state.events',
        'n3-line-chart',

        'app.ui',
        'app.wallet',
        'app.dex',
        'app.welcome',
        'app.utils'
    ]);
})();
