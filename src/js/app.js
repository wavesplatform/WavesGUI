/**
 * Setup of main AngularJS application, with Restangular being defined as a dependency.
 *
 * @see controllers
 * @see services
 */
var app = angular.module('app',
    [
        'restangular',
        'waves.core',
        'waves.core.services',

        'app.ui',
        'app.login',
        'app.navigation'
    ]
);
