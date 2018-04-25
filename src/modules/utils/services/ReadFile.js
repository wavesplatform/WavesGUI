(function () {
    'use strict';

    const factory = function () {

        class ReadFile {

            /**
             * @param {File} fileBlob
             * @return {JQuery.Promise<string>}
             */
            read(fileBlob) {
                /**
                 * @type {JQuery.Deferred}
                 */
                const deferred = $.Deferred();
                const reader = new FileReader();
                reader.addEventListener('error', (error) => {
                    deferred.reject(error);
                });
                reader.addEventListener('progress', (event) => {
                    const percentLoaded = Math.min(Math.round((event.loaded / event.total) * 100), 100);
                    deferred.notify(percentLoaded);
                });
                reader.addEventListener('abort', (event) => {
                    deferred.reject(event);
                });
                reader.addEventListener('load', (event) => {
                    deferred.resolve(event.currentTarget.result);
                }, false);
                reader.readAsBinaryString(fileBlob);

                return deferred.promise();
            }

        }

        return new ReadFile();
    };

    factory.$inject = [];

    angular.module('app.utils').factory('readFile', factory);
})();
