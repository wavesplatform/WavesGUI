(function () {
    'use strict';

    const factory = function ($q) {
        return {

            when: (data) => {
                if (data.then && typeof data.then === 'function') {
                    const defer = $q.defer();
                    data.then(defer.resolve, defer.reject);
                    return defer.promise;
                } else {
                    return $q.when(data);
                }
            }
        };
    };

    factory.$inject = ['$q'];

    angular.module('app.utils').factory('utils', factory);
})();
