(function () {
    'use strict';

    const controller = function (Base, $scope, user, $mdDialog) {

        class TutorialModalsCtrl extends Base {

            constructor() {
                super($scope);
                this.url = location.href;
            }

        }

        return new TutorialModalsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', '$mdDialog'];

    angular.module('app.utils').controller('TutorialModalsCtrl', controller);
})();
