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
        'ngMaterial',
        'app.ui',
        'app.shared',
        'app.login',
        'app.navigation',
        'app.wallet',
        'app.history',
        'app.community'
    ]
);
app.run(['Restangular', 'constants.core', function (rest, coreConstants) {
    // restangular configuration
    rest.setDefaultHttpFields({
        timeout: 10000 // milliseconds
    });
    var url = coreConstants.NODE_ADDRESS;
    //var url = 'http://52.28.66.217:6869';
    rest.setBaseUrl(url);
}]);
