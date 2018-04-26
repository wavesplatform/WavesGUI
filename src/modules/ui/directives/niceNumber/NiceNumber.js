(function () {
    'use strict';

    /**
     * @param Base
     * @param {*} $scope
     * @param {JQuery} $element
     * @param {app.utils} utils
     * @return {NiceNumber}
     */
    const controller = function (Base, $scope, $element, utils) {

        class NiceNumber extends Base {

            constructor() {
                super($scope);

                this.listenEventEmitter(i18next, 'languageChanged', () => this.$onChanges());
                this.receive(utils.observe($scope, 'number'), this.$onChanges, this);
                this.receive(utils.observe($scope, 'precision'), this.$onChanges, this);
            }

            $postLink() {
                $scope.shortMode = $scope.shortMode === 'true';
            }

            $onChanges() {
                if ($scope.number == null || $scope.precision == null) {
                    return $element.html('');
                }

                $element.html(utils.getNiceNumberTemplate($scope.number, $scope.precision, $scope.shortMode));
            }


        }

        return new NiceNumber();
    };

    controller.$inject = ['Base', '$scope', '$element', 'utils'];

    angular.module('app')
        .directive('wNiceNumber', () => {
            return {
                restrict: 'A',
                scope: {
                    number: '<wNiceNumber',
                    precision: '<',
                    shortMode: '<'
                },
                controller: controller
            };
        });
})();
