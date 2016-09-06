/**
 * Setup of main AngularJS application, with Restangular being defined as a dependency.
 *
 * @see controllers
 * @see services
 */
var app = angular.module('app',
    [
        'restangular',
        'app.core',
        'app.core.services',

        'app.login'
    ]
);
