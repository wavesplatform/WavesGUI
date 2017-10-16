(function () {
    'use strict';

    angular.module('app.ui', [])
        .constant('EVENT_STATUSES', {
            SUCCESS: 'success',
            PENDING: 'pending',
            ERROR: 'error'
        });
})();
