(function() {
    'use strict';

    angular.module('app.navigation', ['waves.core.services', 'app.ui', 'app.shared'])
        .constant('navigation.events', {
            NAVIGATION_CREATE_ALIAS: 'navigation-create-alias'
        });
})();
