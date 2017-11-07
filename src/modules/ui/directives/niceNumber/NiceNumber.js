(function () {
    'use strict';

    /**
     * @param {@constructor Base} Base
     * @param {$rootScope.Scope} $scope
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

            $onChanges() {

                if ($scope.number == null || $scope.precision == null) {
                    return $element.html('');
                }

                const num = utils.getNiceNumber($scope.number, $scope.precision);
                const [int, decimal] = num.split('.');

                if (decimal) {
                    const decimalTpl = this._processDecimal(decimal);
                    $element.html(`<span class="int">${int}.</span><span class="decimal">${decimalTpl}</span>`);
                } else {
                    $element.html(`<span class="int">${int}</span>`);
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
                    precision: '<'
                },
                controller: controller
            };
        });
})();
