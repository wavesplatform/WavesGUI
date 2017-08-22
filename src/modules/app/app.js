(function () {
    'use strict';

    const app = angular.module('app', [
        'ngMaterial',
        'ngMessages',
        'ui.router',

        'app.ui',
        'app.welcome',
        'app.utils'
    ]);

    const AppConfig = function ($urlRouterProvider, $stateProvider, $locationProvider) {
        $locationProvider.html5Mode(true);

        $stateProvider
            .state('welcome', {
                url: '/',
                views: {
                    main: {
                        controller: 'WelcomeCtrl as $ctrl',
                        templateUrl: 'modules/welcome/templates/welcome.html'
                    }
                }
            });
    };

    AppConfig.$inject = [
        '$urlRouterProvider', '$stateProvider', '$locationProvider'
    ];

    const AppRun = function () {
        setTimeout(() => {
            const loader = $(document.querySelector('.app-loader'));
            loader.fadeOut(300, () => {
                loader.remove();
            });
        }, 200);
    };

    app.config(AppConfig);
    app.run(AppRun);
})();
