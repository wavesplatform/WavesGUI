(function () {
    'use strict';

    const controller = function (Base, $scope, user, $mdDialog) {

        class TutorialModalsCtrl extends Base {

            constructor() {
                super($scope);
            }

            confirm() {
                user.setSetting('shareAnalytics', this.shareAnalytics);
                $mdDialog.hide();
            }

        }

        return new TutorialModalsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', '$mdDialog'];

    angular.module('app.utils').controller('TutorialModalsCtrl', controller);
})();
