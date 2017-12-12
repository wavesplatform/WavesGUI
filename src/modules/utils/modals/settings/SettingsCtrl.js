(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class SettingsCtrl extends Base {

            constructor() {
                super($scope);
                this.tab = 'security';
            }

        }

        return new SettingsCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('SettingsCtrl', controller);
})();
