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
                    }

                    setActive(active) {
                        this._isActive = active;
                        $element.css('display', active ? 'none' : 'block');
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

