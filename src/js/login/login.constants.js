(function () {
    'use strict';

    angular
        .module('app.login')
        .constant('ui.login.modes', {
            REGISTER: 'register',
            CREATE_SEED: 'create-seed',
            LIST: 'list',
            LOGIN: 'login'
        });

    angular
        .module('app.login')
        .constant('ui.login.events', {
            CHANGE_MODE: 'change-mode',
            GENERATE_SEED: 'generate-seed',  // parameter - seed
            LOGIN: 'login'                   // parameter - account object
        });
})();
