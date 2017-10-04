(function () {
    'use strict';

    const STATE_LIST = [
        { name: 'wallet', base: 'main' },
        { name: 'dex', base: 'main' }
    ];

    /**
     * @param {Base} Base
     * @param $scope
     * @param {User} user
     * @param {app.utils} utils
     * @param $rootScope
     * @returns {LeftMenuCtrl}
     */
    const controller = function (Base, $scope, user) {

        class LeftMenuCtrl extends Base {

            constructor() {
                super($scope);

                this.stateList = STATE_LIST.map(({ base, name }) => {
                    return { base, name, state: user.getActiveState(name) };
                });
            }

        }

        return new LeftMenuCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils', '$rootScope'];

    angular.module('app').controller('LeftMenuCtrl', controller);
})();
