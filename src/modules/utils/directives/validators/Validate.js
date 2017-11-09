(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {app.utils} utils
     * @param {typeof Asset} Asset
     * @param {typeof Number} Number
     * @param {typeof CompareTo} CompareTo
     * @param {typeof Address} Address
     * @return {{require: string, link: (function(*=, *, *, *))}}
     */
    const directive = (Base, utils, Asset, Number, CompareTo, Address) => {

        return {
            require: 'ngModel',
            link: ($scope, $input, $attrs, $ngModel) => {

                /**
                 * $input can be both <input> and <w-input>, in the latter case we should ignore validation
                 */
                if ($input.get(0).tagName !== 'INPUT') {
                    return null;
                }

                class Validate extends Base {

                    constructor() {
                        super($scope);
                        /**
                         * @type {Validator[]}
                         * @private
                         */
                        this._messages = [];

                        this._createValidators();
                        this._onReady()
                            .then(() => {

                                const { parsers, formatters } = this._getProcessors();

                                $ngModel.$parsers.unshift((value) => {
                                    this._validate(value);
                                    return parsers.reduce(Validate.valueFormatReducer, value);
                                });

                                $ngModel.$formatters.unshift((value) => {
                                    return formatters.reduce(Validate.valueFormatReducer, value);
                                });

                                $scope.$watch($attrs.ngModel, () => {
                                    this._validate();
                                });

                                this._validate();
                            });
                    }

                    /**
                     * @private
                     */
                    _validate() {
                        this._messages.forEach((validator) => {
                            validator.validate();
                        });
                    }

                    /**
                     * @return {*|Promise}
                     * @private
                     */
                    _onReady() {
                        return utils.whenAll(this._messages.map((validator) => validator.onReady()));
                    }

                    /**
                     * @return {{parsers: Array, formatters: Array}}
                     * @private
                     */
                    _getProcessors() {
                        const parsers = [];
                        const formatters = [];
                        this._messages.forEach((item) => {
                            const parser = item.getParser();
                            const formatter = item.getFormatter();
                            if (parser) {
                                parsers.push(parser);
                            }
                            if (formatter) {
                                formatters.push(formatter);
                            }
                        });
                        return { parsers, formatters };
                    }

                    /**
                     * @private
                     */
                    _createValidators() {
                        if (!$attrs.wValidate) {
                            throw new Error('Has no validators list!');
                        }
                        const list = $attrs.wValidate.split(',');
                        if (!list.length) {
                            throw new Error('Validators list is empty!');
                        }

                        const hash = Object.create(null);
                        list.forEach((name) => {
                            if (hash[name]) {
                                throw new Error('Duplicate validator!');
                            }
                            this._createValidator(name);
                        });
                    }

                    /**
                     * @param name
                     * @private
                     */
                    _createValidator(name) {
                        let Constructor = null;
                        switch (name) {
                            case 'asset':
                                Constructor = Asset;
                                break;
                            case 'address':
                                Constructor = Address;
                                break;
                            case 'number':
                                Constructor = Number;
                                break;
                            case 'compare':
                                Constructor = CompareTo;
                                break;
                            default:
                                throw new Error('Wrong validator name!');
                        }
                        this._messages.push(new Constructor({ $scope, $input, $attrs, $ngModel }));
                    }

                    static valueFormatReducer(result, item) {
                        return item(result);
                    }

                }

                new Validate();
            }
        };
    };

    directive.$inject = ['Base', 'utils', 'Asset', 'Number', 'CompareTo', 'Address'];

    angular.module('app.utils').directive('wValidate', directive);

})();

