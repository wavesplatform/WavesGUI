(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @param {JQuery} $element
     * @returns {NiceNumber}
     */
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
                $scope.$watch('precision', () => this.$onChanges());
            }

            $onChanges() {

                if ($scope.number == null) {
                    return $element.html('');
                }

                const [int, decimal] = String(Number($scope.number)
                    .toFixed($scope.precision || 8))
                    .split('.');
                const formatted = Number(int)
                    .toLocaleString(i18next.language);

                if (decimal) {
                    const decimalTpl = this._processDecimal(decimal);
                    $element.html(`<span class="int">${formatted}.</span><span class="decimal">${decimalTpl}</span>`);
                } else {
                    $element.html(`<span class="int">${formatted}</span>`);
                }
            }

            _processDecimal(decimal) {
                const mute = [];
                decimal.split('')
                    .reverse()
                    .some((char) => {
                        if (char === '0') {
                            mute.push(0);
                            return false;
                        }
                        return true;
                    });
                const end = decimal.length - mute.length;
                return `${decimal.substr(0, end)}<span class="decimal-muted">${mute.join('')}</span>`;
            }

            $onDestroy() {
                i18next.off('languageChanged', this.listener);
            }

        }

        return new NiceNumber();
    };

    controller.$inject = ['$scope', '$element'];

    angular.module('app')
        .directive('wNiceNumber', () => {
            return {
                restrict: 'A',
                scope: {
                    number: '<wNiceNumber',
                    precision: '<'
                },
                controller: controller
            };
        });
})();
