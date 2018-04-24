(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {$compile} $compile
     * @param {JQuery} $element
     * @param {$rootScope.Scope} $scope
     */
    const controller = function (Base, $element, $scope) {

        const tsUtils = require('ts-utils');

        class Option extends Base {

            constructor() {
                super();
                /**
                 * @type {Select}
                 */
                this.wSelect = null;
                /**
                 * @type {string|number}
                 */
                this.value = null;
                /**
                 * @type {Signal<Option>}
                 */
                this.changeValue = new tsUtils.Signal();

                this._setHandlers();
            }

            $onInit() {
                this.wSelect.registerOption(this);
            }

            /**
             * @return {JQuery}
             */
            getContent() {
                return $(Option._getContentHTML());
            }

            onClick() {
                this.wSelect.setActive(this);
                $scope.$digest();
            }

            setActive(active) {
                const index = this.wSelect.getOptionIndex(this);
                // Get the active option to the top of the dropdown list
                $element.css('order', active ? -index : 0).toggleClass('active', active);
            }

            /**
             * @return {string}
             * @private
             */
            static _getContentHTML() {
                return `<div class="title-content">${Option._getOptionHTML()}</div>`;
            }

            /**
             * @return {string}
             * @private
             */
            static _getOptionHTML() {
                return $element.find('.option:first')
                    .html();
            }

            /**
             * @private
             */
            _setHandlers() {
                this.observe('value', () => {
                    const value = this.value;

                    if (tsUtils.isEmpty(value)) {
                        throw new Error('Value is empty!');
                    }

                    this.changeValue.dispatch(this);
                });
                $element.on('click', this.onClick.bind(this));
            }

        }

        return new Option();
    };

    controller.$inject = ['Base', '$element', '$scope'];

    angular.module('app.ui').component('wOption', {
        transclude: true,
        template: '<div class="option" ng-transclude></div>',
        controller,
        require: {
            wSelect: '^wSelect'
        },
        bindings: {
            value: '<'
        }
    });

})();

