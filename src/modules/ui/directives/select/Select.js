/* eslint-disable no-console */
/* global tsUtils */
(function () {
    'use strict';

    /**
     * @param Base
     * @param {ComponentList} ComponentList
     * @param {JQuery} $element
     * @param {app.utils} utils
     * @param {$rootScope.Scope} $scope
     * @return {Select}
     */
    const controller = function (Base, ComponentList, $element, utils, $scope) {

        const tsUtils = require('ts-utils');
        const $_DOCUMENT = $(document);

        class Select extends Base {

            constructor() {
                super();
                /**
                 * @type {ComponentList}
                 */
                this._options = new ComponentList();
                /**
                 * @type {JQuery}
                 * @private
                 */
                this._activeNode = null;
                /**
                 * @type {JQuery}
                 * @private
                 */
                this._selectList = null;
                /**
                 * @type {JQuery}
                 * @private
                 */
                this._select = null;
                /**
                 * @type {boolean}
                 */
                this.isOpend = false;
                /**
                 * @type {boolean}
                 */
                this.disabled = false;
                /**
                 * @type {Function}
                 * @private
                 */
                this._render = utils.debounce(() => {
                    this._initializeSelected();
                    $scope.$digest();
                }, 100);
            }

            $postLink() {
                this._select = $element.find('.select:first');
                this._activeNode = this._select.find('.title:first');
                this._selectList = this._select.find('.select-list:first');

                this._render();
                this._setHandlers();
            }

            /**
             * @param {Option} option
             */
            registerOption(option) {
                this._options.add(option);
                this._render();
            }

            /**
             * @param {Option} option
             */
            getOptionIndex(option) {
                return this._options.components.indexOf(option);
            }

            /**
             * @param {Option} option
             */
            setActive(option) {
                this._activateTransactionMode = true;
                this._options.forEach((item) => {
                    if (item !== option) {
                        item.setActive(false);
                    }
                });

                this._activeNode.empty();
                this.ngModel = option.value;
                this._activeNode.append(option.getContent());
                option.setActive(true);
                this._toggleList(false);
                this._activateTransactionMode = false;
            }

            /**
             * @private
             */
            _setHandlers() {
                this.listenEventEmitter(this._activeNode, 'click', () => this._onClick());
                this.observe('disabled', this._onChangeDisabled);
                this.receive(this._options.signals.remove, this._render, this);
                this.receive(this._options.signals.add, this._render, this);
                this.observe('ngModel', this._render);
            }

            /**
             * @private
             */
            _initializeSelected() {

                if (!this._options.length) {
                    return null;
                }

                if (tsUtils.isEmpty(this.ngModel)) {
                    this.setActive(this._options.first());
                    return null;
                }

                const [active] = this._options.where({ value: this.ngModel }).components;
                if (active) {
                    this.setActive(active);
                } else {
                    this.setActive(this._options.first());
                    $scope.$apply();
                }
            }

            /**
             * @private
             */
            _onClick() {
                if (!this.disabled) {
                    this._toggleList();
                }
            }

            /**
             * @param {MouseEvent} event
             * @private
             */
            _checkOutClick(event) {
                if ($(event.target).closest($element).length === 0) {
                    this._toggleList(false);
                }
            }

            /**
             * @private
             */
            _onChangeDisabled() {
                this._select.toggleClass('disabled', this.disabled);
                this._toggleList(false);
            }

            /**
             * @param {boolean} [state]
             * @private
             */
            _toggleList(state) {
                const targetState = tsUtils.isEmpty(state) ? !this.isOpend : state;
                if (targetState !== this.isOpend) {
                    this.isOpend = targetState;
                    this._select.toggleClass('expanded', this.isOpend);
                    this._animate();

                    if (this.isOpend) {
                        this.listenEventEmitter($_DOCUMENT, 'click', (e) => this._checkOutClick(e));
                    } else {
                        this.stopListenEventEmitter('click', $_DOCUMENT);
                    }
                }
            }

            /**
             * @return {Promise}
             * @private
             */
            _animate() {
                if (this.isOpend) {
                    this._selectList.css({ display: 'flex', height: 'auto' });
                    const height = this._selectList.outerHeight();
                    this._selectList.css('height', 0);
                    return utils.animate(this._selectList, { height }, { duration: 100 });
                } else {
                    return utils.animate(this._selectList, { height: 0 }, { duration: 100 }).then(() => {
                        this._selectList.css('display', 'none');
                    });
                }
            }

        }

        return new Select();
    };

    controller.$inject = ['Base', 'ComponentList', '$element', 'utils', '$scope'];

    angular.module('app.ui').component('wSelect', {
        bindings: {
            ngModel: '=',
            disabled: '<'
        },
        templateUrl: 'modules/ui/directives/select/select.html',
        transclude: true,
        controller
    });
})();
