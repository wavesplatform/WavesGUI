(function() {
    'use strict';

    angular
        .module('app.ui', [])
        .constant('ui.events', {
            SPLASH_COMPLETED: 'splash-completed',
            LOGIN_SUCCESSFUL: 'login-successful'
        })
        // actual values are set in the application config phase
        .value('settings.application', {
            CLIENT_VERSION: '',
            NODE_ADDRESS: ''
        });
})();
