(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {app.utils} utils
     */
    const directive = (Base, utils) => {

        return {
            scope: {
                value: '<',
                searchValue: '='
            },
            require: {
                select: '^wSelect'
            },
            transclude: true,
            template: '<div class="option" ng-transclude></div>',
            link: ($scope, $element, $attrs, { select }, $transclude) => {

                const tsUtils = require('ts-utils');

                class Option extends Base {

                    /**
                     * @type {Select}
                     */
                    wSelect = select;
                    /**
                     * @type {string|number}
                     */
                    value = $scope.value;

                    /**
                     * @type {Signal<Option>}
                     */
                    changeValue = new tsUtils.Signal();

                    /*
                     * @type { number }
                     */
                    index = 1;

                    constructor() {
                        super($scope);

                        this._setHandlers();
                        this.wSelect.registerOption(this);
                    }

                    /**
                     * @return {JQuery}
                     */
                    getContent() {
                        const $element = $(Option._getContentHTML());
                        $transclude($scope.$parent, ($clone) => {
                            $element.append($clone);
                        });
                        return $element;
                    }

                    onClick() {
                        this.wSelect.setActive(this);
                        $scope.$apply();
                    }

                    setActive(active) {
                        const index = this.wSelect.getOptionIndex(this);
                        // Get the active option to the top of the dropdown list
                        $element.css('order', active ? -index : 0).toggleClass('active', active);
                    }

                    filterAndSort(query) {
                        const searchValue = utils.toArray($scope.searchValue.filter(Boolean));
                        const queryValue = query.toLocaleLowerCase();

                        this.index = searchValue.findIndex(str => str.toLocaleLowerCase().includes(queryValue));
                        $element.css('order', this.index);
                        if (this.index > -1) {
                            $element.show();
                        } else {
                            $element.hide();
                        }
                    }

                    show() {
                        $element.show();
                    }

                    /**
                     * @return {string}
                     * @private
                     */
                    static _getContentHTML() {
                        return '<div class="title-content"></div>';
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
            }
        };
    };

    directive.$inject = ['Base', 'utils'];

    angular.module('app.ui').directive('wOption', directive);

})();

