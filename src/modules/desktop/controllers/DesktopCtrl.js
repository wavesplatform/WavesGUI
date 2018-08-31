(function () {
    'use strict';

    /**
     * @param {ModalManager} modalManager
     * @param {*} $state
     */
    const controller = function (modalManager, $state, Base, storage) {

        class DesktopCtrl extends Base {

            get openLinkViaDesktop() {
                return this.openClientMode === 'desktop';
            }

            set openLinkViaDesktop(value) {
                if (value) {
                    this.openClientMode = 'desktop';
                } else {
                    this.openClientMode = null;
                }
                storage.save('openClientMode', this.openClientMode);
            }

            openClientMode = null;

            constructor() {
                super();

                storage.load('openClientMode').then(mode => {
                    this.openClientMode = mode;
                });
            }

            showTutorialModals() {
                return modalManager.showTutorialModals();
            }

            openMainPage() {
                return $state.go('welcome');
            }

        }

        return new DesktopCtrl();
    };

    controller.$inject = ['modalManager', '$state', 'Base', 'storage'];

    angular.module('app.desktop').controller('DesktopCtrl', controller);
})();
