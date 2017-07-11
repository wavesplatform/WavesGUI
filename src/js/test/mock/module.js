/**
 * Created by daniil on 06.07.17.
 */

angular.module('mock', [])
    .service('$q', function () {
        'use strict';

        return {
            when: function (data) {
                return Promise.resolve(data);
            }
        };
    });
