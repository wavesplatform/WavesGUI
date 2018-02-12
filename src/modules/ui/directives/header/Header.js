(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {Router} router
     * @param {*} $scope
     * @return {Header}
     */
    const controller = function (Base, router, $scope) {

        class Header extends Base {

            constructor() {
                super();

                this.receive(router.changeRouteState, () => {
                    this.stateList = router.subStateList;
                    $scope.$apply();
                });
                this.stateList = router.subStateList;
            }

        }

        return new Header();
    };

    controller.$inject = ['Base', 'router', '$scope'];

    angular.module('app.ui').component('wHeader', {
        controller: controller,
        templateUrl: 'modules/ui/directives/header/header.html'
    });
})();
