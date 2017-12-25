(function () {
    'use strict';

    const directive = (Base, $compile) => {

        return {
            scope: true,
            require: {
                select: '^wSelect'
            },
            transclude: true,
            template: '<div class="option" ng-transclude></div>',
            link: ($scope, $element, $attrs, { select }) => {

                class Option extends Base {

                    constructor() {
                        super($scope);
                        /**
                         * @type {boolean}
                         * @private
                         */
                        this._isActive = false;
                        /**
                         * @type {Select}
                         */
                        this.select = select;
                        /**
                         * @type {string|number}
                         */
                        this.value = $attrs.value;

                        if ($attrs.optionType) {
                            switch ($attrs.optionType) {
                                case 'boolean':
                                    this.value = this.value === 'true';
                                    break;
                                case 'number':
                                    this.value = Number(this.value);
                                    break;
                                default:
                                    throw new Error('Wrong option type!');
                            }
                        }

                        /**
                         * @type {Select}
                         */
                        this.select.registerOption(this);

                        if (tsUtils.isEmpty(this.value)) {
                            throw new Error('Empty value of option!');
                        }

                        this._setHandlers();
                    }

                    /**
                     * @return {JQuery}
                     */
                    getContent() {
                        return $compile(this._getContentHTML())($scope);
                    }

                    onClick() {
                        this.select.setActive(this);
                        $scope.$apply();
                    }

                    setActive(active) {
                        this._isActive = active;
                        const index = this.select.getOptionIndex(this);
                        // Get the active option to the top of the dropdown list
                        $element.css('order', active ? -index : 0).toggleClass('active', active);
                    }

                    /**
                     * @return {string}
                     * @private
                     */
                    _getContentHTML() {
                        return `<div class="title-content">${$element.find('.option').html()}</div>`;
                    }

                    /**
                     * @private
                     */
                    _setHandlers() {
                        $element.on('click', this.onClick.bind(this));
                    }

                }

                new Option();
            }
        };
    };

    directive.$inject = ['Base', '$compile'];

    angular.module('app.ui').directive('wOption', directive);

})();

