(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {StateManager} stateManager
     * @param {*} $scope
     * @return {Header}
     */
    const controller = function (Base, stateManager, $scope) {

        class Header extends Base {

            constructor() {
                super();

                this.receive(stateManager.changeRouteState, () => {
                    this.stateList = stateManager.subStateList;
                    $scope.$apply();
                });
                this.stateList = stateManager.subStateList;
            }

        }

        return new Header();
    };

    controller.$inject = ['Base', 'stateManager', '$scope'];

    angular.module('app.ui').component('wHeader', {
        controller: controller,
        templateUrl: 'modules/ui/directives/header/header.html'
    });
})();
