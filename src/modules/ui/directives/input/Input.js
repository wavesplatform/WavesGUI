(function () {
    'use strict';

    /**
     * @param Base
     * @param {app.utils} utils
     * @return {{result: string, require: null, transclude: boolean, template: (function(*, *)), link: link}}
     */
    const directive = (Base, utils) => {

        return {
            result: 'E',
            require: null,
            transclude: false,
            template: ($element, $data) => {
                const attrs = Object.keys($data.$attr).reduce((result, name) => {
                    result.push(`${$data.$attr[name]}="${$data[name]}"`);
                    return result;
                }, []);
                const typeClass = $data.type ? `input-type-${$data.type}` : '';
                if ('textarea' in $data) {
                    return `<div class="w-input-wrap ${typeClass}"><textarea ${attrs.join(' ')}></textarea></div>`;
                } else {
                    return `<div class="w-input-wrap ${typeClass}"><input ${attrs.join(' ')}></div>`;
                }
            },
            /**
             * @param $scope
             * @param {JQuery} $element
             * @param $attrs
             * @return {Input}
             */
            link: function ($scope, $element, $attrs) {


                class Input extends Base {

                    constructor() {
                        super($scope);

                        /**
                         * @type {JQuery}
                         * @private
                         */
                        this._$input = null;
                        /**
                         * @type {JQuery}
                         * @private
                         */
                        this._$inputWrap = null;
                        /**
                         * @type {ngForm}
                         * @private
                         */
                        this._$form = null;
                        /**
                         * @type {Array}
                         * @private
                         */
                        this._stopScopeHandlers = [];
                        /**
                         * @type {string}
                         * @private
                         */
                        this._name = null;
                        this._initialize();
                    }

                    $onDestroy() {
                        super.$onDestroy();
                        this._stopScopeHandlers.forEach((cb) => cb());
                    }

                    /**
                     * @private
                     */
                    _initialize() {
                        this._$input = $element.find('input,textarea');
                        this._$inputWrap = $element.find('.w-input-wrap');

                        const name = this._name = this._getName();
                        const formName = $element.closest('form').attr('name');

                        this._setHandlers();

                        if (this._name && formName) {

                            const form = this._$form = this._getForm(formName);

                            this.receive(utils.observe(form[name], '$valid'), this._onChangeValid, this);
                            this.receive(utils.observe(form[name], '$touched'), this._onChangeTouched, this);

                            this._onChangeValid();
                            this._onChangeTouched();
                        }

                        if ($attrs.autoFocus) {
                            this._$input.focus();
                        }
                    }

                    _setHandlers() {
                        this._$input.on('focus', () => {
                            this._$inputWrap.addClass('focused');
                        });

                        this._$input.on('blur', () => {
                            this._$inputWrap.removeClass('focused');
                        });

                        if ($attrs.wType === 'number') {

                            const reg = /[0-9.]/;
                            this._$input.on('keypress', (event) => {
                                if (event.keyCode != null) {
                                    const char = String.fromCharCode(event.keyCode);
                                    if (char != null) {
                                        if (reg.test(char)) {
                                            if (char === '.' && this._$input.val().includes('.')) {
                                                // TODO add separator from locale
                                                event.preventDefault();
                                            }
                                        } else {
                                            event.preventDefault();
                                        }
                                    }
                                }
                            });
                        }
                    }

                    _getName() {
                        const name = this._$input.attr('name');

                        if (!name) {
                            return null;
                        }

                        if (name.indexOf('{{') === -1) {
                            return name;
                        } else {
                            return $scope.$eval(name.replace('{{', '')
                                .replace('}}', '')
                                .replace('::', ''));
                        }
                    }

                    _getForm(name) {
                        let $localScope = $scope;
                        let form = null;
                        do {
                            form = $localScope.$eval(name);
                            if (form) {
                                break;
                            } else {
                                $localScope = $localScope.$parent;
                            }
                        } while ($localScope.$parent);

                        if (!form) {
                            throw new Error('Cant find parent form data!');
                        }

                        return form;
                    }

                    /**
                     * @private
                     */
                    _onChangeValid() {
                        this._$inputWrap.toggleClass('valid', this._$form[this._name].$valid);
                        this._$inputWrap.toggleClass('invalid', !this._$form[this._name].$valid);
                    }

                    /**
                     * @private
                     */
                    _onChangeTouched() {
                        this._$inputWrap.toggleClass('touched', this._$form[this._name].$touched);
                    }

                }

                return new Input();
            }
        };
    };

    directive.$inject = ['Base', 'utils'];

    angular.module('app.ui').directive('wInput', directive);

})();

