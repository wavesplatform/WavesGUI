(function () {
    'use strict';

    angular
        .module('app.login')
        .constant('ui.login.modes', {
            REGISTER: 'register',
            CREATE_SEED: 'create-seed',
            LIST: 'list'
        });

    angular
        .module('app.login')
        .constant('ui.login.events', {
            CHANGE_MODE: 'change-mode',
        });
})();
