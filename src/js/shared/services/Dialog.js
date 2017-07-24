(function () {
    'use strict';

    function Dialog($document) {

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
            const result = $document.find(`body > div.modal.recyclable`);
            _.forEach(result, (divNode) => {
                divNode.remove();
            });
        };

    }

    Dialog.$inject = [`$document`];

    angular
        .module(`app.shared`)
        .service(`dialogService`, Dialog);
})();
