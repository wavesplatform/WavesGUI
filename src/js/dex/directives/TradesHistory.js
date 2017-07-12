(function () {
    'use strict';

    angular
        .module(`app.dex`)
        .component(`wavesDexHistory`, {
            bindings: {
                pair: `<`,
                trades: `<`
            },
            templateUrl: `dex/history.component`
        });
})();
