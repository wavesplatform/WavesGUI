(function () {
    'use strict';

    const prefix = `Waves Lite Client`;

    function DocumentTitle() {
        this.set = function (title) {
            document.title = prefix + (title ? ` | ${title}` : ``);
        };
    }

    angular
        .module(`app.shared`)
        .service(`documentTitleService`, DocumentTitle);
})();
