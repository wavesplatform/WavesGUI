(function () {
    'use strict';

    // function Page($attrs) {
    function Page() {
        // documentTitleService.set($attrs.pageTitle); // TODO : uncomment this when all pages are using that component.
    }

    Page.$inject = ['$attrs'];

    angular
        .module('app.shared')
        .component('wavesPage', {
            controller: Page,
            bindings: {
                pageTitle: '@'
            }
        });
})();
