(function () {
    'use strict';

    const controller = function (Base, $scope) {

        const analytics = require('@waves/event-sender');

        class TutorialModalsCtrl extends Base {

            constructor({ hasAccounts }) {
                super($scope);
                this.isDesktop = WavesApp.isDesktop();
                this.isWeb = WavesApp.isWeb();
                this.hasAccounts = hasAccounts;
                analytics.send({ name: 'Onboarding SEED Popup Show', target: 'ui' });
            }

        }

        return new TutorialModalsCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('TutorialModalsCtrl', controller);
})();
