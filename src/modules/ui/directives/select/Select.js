(function () {
    'use strict';

    /**
     * @param Base
     * @param {ComponentList} ComponentList
     * @param {JQuery} $element
     * @param {$timeout} $timeout
     * @param {$q} $q
     * @param {app.utils} utils
     * @return {Select}
     */
    const controller = function (Base, ComponentList, $element, $timeout, $q, utils) {

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
                /**
                 * @type {boolean}
                 * @private
                 */
                this._activateTransactionMode = false;

                this.observe('ngModel', () => {
                    if (!this._activateTransactionMode) {
                        const option = tsUtils.find(this._options.components, { value: this.ngModel });
                        if (option) {
                            this.setActive(option);
                        } else {
                            console.warn('Wrong option activate!');
                        }
                    }
                });
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
                this._activeCid = option.cid;
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
                    const height = this._selectList.height();
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

    controller.$inject = ['Base', 'ComponentList', '$element', '$timeout', '$q', 'utils'];

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
