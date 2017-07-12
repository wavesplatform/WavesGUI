angular.module(`mock`, [])
    .service(`$q`, () => {
        'use strict';

        return {
            when(data) {
                return Promise.resolve(data);
            }
        };
    });
