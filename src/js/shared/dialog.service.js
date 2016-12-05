(function () {
    'use strict';

    angular
        .module('app.shared')
        .service('dialogService', ['$document', function ($document) {
            this.open = function (elementAccessor, options) {
                angular.element(elementAccessor).modal(options);
            };

            this.openNonCloseable = function (elementAccessor) {
                this.open(elementAccessor, {
                    escapeClose: false,
                    clickClose: false,
                    showClose: false
                });
            };

            this.close = function () {
                angular.element.modal.close();
            };

            /**
                jquery.modal pollutes document body with copied modal dialog divs
                This creates several items with the same "id" and dialogService opens
                dialogs with outdated data
             */
            this.cleanup = function () {
                var result = $document.find('body > div.modal.recyclable');
                _.forEach(result, function (divNode) {
                    divNode.remove();
                });
            };
        }]);
})();
