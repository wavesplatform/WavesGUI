(function () {
    'use strict';

    const url = `support.wavesplatform.com`;

    angular
        .module(`app.shared`)
        .component(`wavesSupportLink`, {
            template: `<a href="http://${url}" target="_blank">${url}</a>`
        });
})();
