(function () {
    'use strict';

    /**
     * @return {CopyService}
     */
    const factory = function () {

        class CopyService {

            copy(data) {
                const handler = function (e) {
                    e.clipboardData.setData('text/plain', data);
                    e.preventDefault();
                };
                document.addEventListener('copy', handler);
                document.execCommand('copy');
                document.removeEventListener('copy', handler);
            }

        }

        return new CopyService();
    };

    angular.module('app.utils').factory('copyService', factory);
})();
