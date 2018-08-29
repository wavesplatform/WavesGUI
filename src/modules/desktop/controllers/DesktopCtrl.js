(function () {
    'use strict';

    /**
     * @param {ModalManager} modalManager
     * @param {*} $state
     */
    const controller = function (modalManager, $state) {
        this.showTutorialModals = () => modalManager.showTutorialModals();
        this.openMainPage = () => $state.go('welcome');
    };

    controller.$inject = ['modalManager', '$state'];

    angular.module('app.desktop').controller('DesktopCtrl', controller);
})();
