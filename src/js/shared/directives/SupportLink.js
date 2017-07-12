(function () {
    'use strict';

    var url = 'support.wavesplatform.com';

    function SupportLink() {}

    angular
        .module('app.shared')
        .component('wavesSupportLink', {
            controller: SupportLink,
            template: '<a href="http://' + url + '" target="_blank">' + url + '</a>'
        });
})();
