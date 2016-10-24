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

        'ngclipboard',
        'ngMessages',
        'ngValidate',
        'ngAnimate',
        'app.ui',
        'app.shared',
        'app.login',
        'app.navigation',
        'app.wallet',
        'app.history',
        'app.community'
    ]
);
