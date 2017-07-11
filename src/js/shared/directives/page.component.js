(function () {
    'use strict';

    function PageController($attrs, documentTitleService) {
        // documentTitleService.set($attrs.pageTitle); // TODO : uncomment this when all pages are using that component.
    }

    PageController.$inject = ['$attrs', 'documentTitleService'];

    angular
        .module('app.shared')
        .component('wavesPage', {
            controller: PageController,
            bindings: {
                pageTitle: '@'
            }
        });
})();
