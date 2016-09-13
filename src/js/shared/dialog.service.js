(function () {
    'use strict';

    angular
        .module('app.shared')
        .service('dialogService', [function () {
            this.open = function (elementAccessor, options) {
                angular.element(elementAccessor).modal(options);
            };

            this.close = function () {
                angular.element.modal.close();
            }
        }]);
})();
