(function () {
    'use strict';

    const welcome = angular.module('app.welcome', ['app.welcome.getStarted']);

    const WelcomeConfig = function ($stateProvider) {

        $stateProvider
            .state('get_started', {
                url: '/get_started',
                views: {
                    main: {
                        controller: 'GetStartedCtrl as $ctrl',
                        templateUrl: 'modules/welcome/modules/getStarted/templates/getStarted.html'
                    }
                }
            });

    };

    WelcomeConfig.$inject = ['$stateProvider'];

    welcome
        .config(WelcomeConfig);

})();
