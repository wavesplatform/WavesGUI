(function () {
    'use strict';

    const controller = function (Base, $scope, modalManager) {

        const analytics = require('@waves/event-sender');

        class TutorialModalsCtrl extends Base {

            constructor() {
                super($scope);
                this.isDesktop = WavesApp.isDesktop();
                this.isWeb = WavesApp.isWeb();
                analytics.send({ name: 'Onboarding SEED Popup Show', target: 'ui' });
            }

            showSeedBackupModal() {
                modalManager.showSeedBackupModal();
            }

        }

        return new TutorialModalsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'modalManager'];

    angular.module('app.utils').controller('TutorialModalsCtrl', controller);
})();
