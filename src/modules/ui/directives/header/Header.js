(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {StateManager} stateManager
     * @param {*} $scope
     * @return {Header}
     */
    const controller = function (Base, stateManager) {

        class Header extends Base {

            constructor() {
                super();

                this.receive(stateManager.changeRouteState, () => {
                    this.stateList = stateManager.subStateList;
                });
                this.stateList = stateManager.subStateList;
            }

        }

        return new Header();
    };

    controller.$inject = ['Base', 'stateManager'];

    angular.module('app.ui').component('wHeader', {
        controller: controller,
        templateUrl: 'modules/ui/directives/header/header.html'
    });
})();
