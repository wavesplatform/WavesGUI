(function () {
    'use strict';

    /**
     * @param {JQuery} $element
     * @param {$rootScope.Scope} $scope
     * @param {Base} Base
     * @return {Radio}
     */
    const controller = function ($element, $scope, Base) {

        class Radio extends Base {

            get checked() {
                return this.radioWrap.getValue() === this.value;
            }

            constructor() {
                super();
                /**
                 * @type {RadioWrap}
                 * @private
                 */
                this.radioWrap = null;
                /**
                 * @type {JQuery}
                 * @private
                 */
                this.input = null;
                /**
                 * @type {string}
                 * @private
                 */
                this.name = null;
                /**
                 * @type {string}
                 * @private
                 */
                this.value = null;
                /**
                 * @type {string}
                 */
                this.class = null;
            }

            $postLink() {
                this.class = this.class || 'btn btn-radio';
                this.input = $element.find('input');
                this.radioWrap.addRadio(this);
                this._setHandlers();
                this.observe('value', this._onChangeValueAttr);
                this._onChangeValueAttr();
            }

            init() {
                this._setChecked();
            }

            _setHandlers() {
                this.input.on('change', () => {
                    this.radioWrap.setValue(this.value);
                    $scope.$apply();
                });
            }

            _onChangeValueAttr() {
                this._setChecked();
            }

            _setChecked() {
                this.input.prop('checked', this.checked);
            }

        }

        return new Radio();
    };

    controller.$inject = ['$element', '$scope', 'Base'];

    angular.module('app.ui')
        .component('wRadio', {
            bindings: {
                value: '<',
                class: '@'
            },
            transclude: true,
            templateUrl: 'modules/ui/directives/radio/radio.html',
            require: {
                radioWrap: '^wRadioWrap'
            },
            controller
        });
})();
