(function () {
    'use strict';

    angular
        .module(`app.shared`, []);

    angular
        .module(`app.shared`)
        .constant(`constants.tooltip`, {
            contentAsHTML: false,
            delay: 1000
        });
})();
