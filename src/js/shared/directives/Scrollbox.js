(function () {
    'use strict';

    angular
        .module(`app.shared`)
        .component(`wavesScrollbox`, {
            transclude: true,
            template: `<div ng-transclude></div>`
        });
})();
