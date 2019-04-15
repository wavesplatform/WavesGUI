(function () {
    'use strict';

    const controller = function (Base, $scope) {

        const analytics = require('@waves/event-sender');

        class TutorialModalsCtrl extends Base {

            constructor() {
                super($scope);
                this.isDesktop = WavesApp.isDesktop();
                this.isWeb = WavesApp.isWeb();
                analytics.send({ name: 'Onboarding SEED Popup Show', target: 'ui' });
            }

        }

        return new TutorialModalsCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('TutorialModalsCtrl', controller);
})();
