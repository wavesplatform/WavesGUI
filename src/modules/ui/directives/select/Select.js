(function () {
    'use strict';

    /**
     * @param Base
     * @param {ComponentList} ComponentList
     * @param {JQuery} $element
     * @param {$timeout} $timeout
     * @param {$q} $q
     * @return {Select}
     */
    const controller = function (Base, ComponentList, $element, $timeout, $q) {

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
                 * @type {*}
                 * @private
                 */
                this._timer = null;
                /**
                 * @type {Deferred}
                 * @private
                 */
                this._ready = $q.defer();
                /**
                 * @type {boolean}
                 */
                this.isOpend = false;
                /**
                 * @type {boolean}
                 */
                this.disabled = false;
            }

            $postLink() {
                this._select = $element.find('.select:first');
                this._activeNode = this._select.find('.title:first');
                this._selectList = this._select.find('.select-list:first');

                this._setHandlers();

                this._ready.resolve();
            }

            /**
             * @param {Option} option
             */
            registerOption(option) {
                this._ready.promise.then(() => {
                    this._options.push(option);
                    if (option.value === this.ngModel) {
                        this.setActive(option);
                    }
                    if (!this._timer) {
                        this._timer = $timeout(() => {
                            if (tsUtils.isEmpty(this.ngModel)) {
                                this.setActive(this._options.first());
                            } else if (!this._options.some({ value: this.ngModel })) {
                                this.setActive(this._options.first());
                            }
                        }, 100);
                    }
                });
            }

            /**
             * @param {Option} option
             */
            setActive(option) {
                this._options.forEach((item) => {
                    if (item !== option) {
                        item.setActive(false);
                    }
                });
                this._activeCid = option.cid;
                this._activeNode.empty();
                this.ngModel = option.value;
                this._activeNode.append(option.getContent());
                option.setActive(true);
                this._toggleList(false);
            }

            /**
             * @private
             */
            _setHandlers() {
                this._activeNode.on('click', () => this._onClick());
                this.observe('disabled', this._onChangeDisabled);
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
             * @private
             */
            _onChangeDisabled() {
                this._select.toggleClass('disabled', this.disabled);
            }

            /**
             * @param {boolean} [state]
             * @private
             */
            _toggleList(state) {
                const targetState = tsUtils.isEmpty(state) ? !this.isOpend : state;
                if (targetState !== this.isOpend) {
                    const method = targetState ? 'slideDown' : 'slideUp';
                    this.isOpend = targetState;
                    this._selectList[method](100);
                    this._select.toggleClass('expanded', this.isOpend);
                }
            }

        }

        return new Select();
    };

    controller.$inject = ['Base', 'ComponentList', '$element', '$timeout', '$q'];

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
