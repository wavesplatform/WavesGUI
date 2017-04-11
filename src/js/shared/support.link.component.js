(function () {
    'use strict';

    var email = 'support@wavesplatform.com';

    function SupportLinkController() {}

    angular
        .module('app.shared')
        .component('wavesSupportLink', {
            controller: SupportLinkController,
            template: '<a href="mailto:' + email + '" target="_blank">' + email + '</a>'
        });
})();
