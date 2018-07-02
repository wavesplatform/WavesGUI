(function () {
    'use strict';

    const origin = angular.module;
    angular.module = function (...args) {
        const [name] = args;
        if (WavesApp.modules.indexOf(name) === -1) {
            WavesApp.modules.push(name);
        }
        const module = origin.call(angular, ...args);
        const controller = module.controller;
        module.controller = function (name, $ctrl) {
            if (typeof $ctrl !== 'function') {
                throw new Error('Wrong code style!');
            }
            WavesApp.addController(name, $ctrl);
            return controller.call(this, name, $ctrl);
        };

        return module;
    };

    angular.module('app', [
        'ngAnimate',
        'ngMaterial',
        'ui.router',
        'ui.router.state.events',
        'n3-line-chart',

        'app.templates',
        'app.utils',
        'app.ui',
        'app.welcome',
        'app.create',
        'app.restore',
        'app.wallet',
        'app.dex',
        'app.tokens'
        // 'app.sessions'
    ]);
})();
