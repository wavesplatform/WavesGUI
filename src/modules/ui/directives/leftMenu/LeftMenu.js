(function () {
    'use strict';

    const LEFT_MENU_ROOT_ID = 'main';

    /**
     * @param Base
     * @param {Router} router
     * @param {ModalManager} modalManager
     * @param {*} $scope
     * @return {LeftMenu}
     */
    const controller = function (Base, router, modalManager, $scope) {

        class LeftMenu extends Base {

            constructor() {
                super();
                this.receive(router.changeRouteState, () => {
                    this.subStateList = router.subStateList;
                    this.rootStateList = router.rootStateList;
                    $scope.$apply();
                });
                this.rootStateList = router.rootStateList;
                this.subStateList = router.subStateList;
            }

            logout() {
                location.reload();
            }

            avatarClick() {
                modalManager.showAccountInfo();
            }

            settings() {
                modalManager.showSettings();
            }

        }

        return new LeftMenu();
    };

    controller.$inject = ['Base', 'router', 'modalManager', '$scope'];

    angular.module('app.ui').component('wLeftMenu', {
        bindings: {},
        templateUrl: 'modules/ui/directives/leftMenu/leftMenu.html',
        transclude: false,
        controller
    });
})();
