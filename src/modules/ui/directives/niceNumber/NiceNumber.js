(function () {
    'use strict';

    const controller = function ($scope, $element) {

        class NiceNumber {

            constructor() {
                /**
                 * @type {string}
                 */
                this.number = null;

                this.listener = () => {
                    this.$onChanges();
                };
                i18next.on('languageChanged', this.listener);
                $scope.$watch('number', () => this.$onChanges());
            }

            $onChanges() {

                if ($scope.number == null) {
                    return $element.html('');
                }

                const [int, float] = String($scope.number).split('.');
                const formatted = Number(int).toLocaleString(i18next.language);

                if (float) {
                    $element.html(`<span class="int">${formatted}.</span><span class="float">${float}</span>`);
                } else {
                    $element.html(`<span class="int">${formatted}</span>`);
                }
            }

            $onDestroy() {
                i18next.off('languageChanged', this.listener);
            }

        }

        return new NiceNumber();
    };

    controller.$inject = ['$scope', '$element'];

    angular.module('app').directive('wNiceNumber', () => {
        return {
            restrict: 'A',
            scope: {
                number: '<wNiceNumber'
            },
            controller: controller
        };
    });
})();
