(function () {
    'use strict';

    function ApplicationContextFactory() {
        return {
            account: {}
        }
    }

    ApplicationContextFactory.$inject = [];

    angular
        .module('app.ui')
        .factory('applicationContext', ApplicationContextFactory);
})();
