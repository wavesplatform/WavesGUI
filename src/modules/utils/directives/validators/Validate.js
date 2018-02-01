(function () {
    'use strict';

    const AVAILABLE_VALIDATORS = [
        'gt',
        'gte',
        'lt',
        'lte',
        'length',
        'integer',
        'precision',
        'byte',
        'asset'
    ];

    /**
     *
     * @param {app.utils} utils
     * @param {ValidateService} validateService
     * @param {Waves} waves
     */
    const directive = function (utils, validateService, waves) {
        return {
            require: 'ngModel',
            priority: 10000,
            compile: function ($input, $attrs) {

                /**
                 * $input can be both <input> and <w-input>, in the latter case we should ignore validation
                 */
                if ($input.get(0).tagName !== 'INPUT') {
                    return null;
                }

                return function ($scope, $input, $compiledAttrs, $ngModel) {

                    class Validate {

                        constructor() {
                            this._validators = Object.create(null);

                            this._createValidatorList();
                            $scope.$watch($attrs.ngModel, () => this._validate());
                        }

                        /**
                         * @param validators
                         * @private
                         */
                        _applyValidators(validators) {
                            validators.forEach(({ name, handler }) => {
                                const result = handler($ngModel.$modelValue, $ngModel.$viewValue);

                                switch (typeof result) {
                                    case 'boolean':
                                        $ngModel.$setValidity(name, result);
                                        break;
                                    case 'object':
                                        if (result && typeof result.then === 'function') {
                                            $ngModel.$setValidity(`pending-${name}`, false);
                                            const onEnd = () => {
                                                $ngModel.$setValidity(`pending-${name}`, true);
                                            };
                                            result.then(() => {
                                                $ngModel.$setValidity(name, true);
                                                onEnd();
                                            }, () => {
                                                $ngModel.$setValidity(name, false);
                                                onEnd();
                                            });
                                        } else {
                                            throw new Error('Wrong validation result!');
                                        }
                                        break;
                                    default:
                                        throw new Error('Wrong validation result!');
                                }
                            });
                        }

                        /**
                         * @private
                         */
                        _validate() {// TODO async
                            this._applyValidators(Object.keys(this._validators).map((name) => this._validators[name]));
                        }

                        /**
                         * @param targetName
                         * @private
                         */
                        _validateByName(targetName) {
                            this._applyValidators([this._validators[targetName]].filter(Boolean));
                        }

                        /**
                         * @private
                         */
                        _createValidatorList() {
                            AVAILABLE_VALIDATORS.filter(Validate._hasValidator).forEach((name) => {
                                this._createValidator(name);
                            });
                        }

                        /**
                         * @param name
                         * @private
                         */
                        _createValidator(name) {

                            if (this._validators[name]) {
                                throw new Error(`Duplicate validator! ${name}`);
                            }

                            switch (name) {
                                case 'asset':
                                    this._validators[name] = this._createAssetValidator(name);
                                    break;
                                default:
                                    this._validators[name] = this._createSimpleValidator(name);
                            }

                            if (this._validators[name].parser) {
                                $ngModel.$parsers.unshift(this._validators[name].parser);
                            }

                            if (this._validators[name].formatter) {
                                $ngModel.$formatters.unshift(this._validators[name].formatter);
                            }

                            return this._validators[name];
                        }

                        /**
                         *
                         * @param name
                         * @return {*}
                         * @private
                         */
                        _createAssetValidator(name) {
                            const precisionValidator = this._createValidator('precision');
                            let value;

                            const validator = {
                                name: name,
                                asset: null,
                                money: null,
                                value: null,
                                apply: () => {
                                    precisionValidator.value = validator.asset.precision;
                                    this._validateByName(name);
                                },
                                handler: () => true,
                                parser: (value) => {
                                    return Validate._toMoney(value, validator.money);
                                },
                                formatter: (value) => {
                                    return Validate._toString(value);
                                }
                            };

                            Object.defineProperty(validator, 'value', {
                                get: () => value,
                                set: (assetData) => {

                                    validator.asset = null;
                                    validator.money = null;

                                    if (!assetData) {
                                        return null;
                                    }

                                    const id = (typeof assetData === 'string' ? assetData : assetData.id);
                                    value = id;
                                    if (id) {
                                        Waves.Money.fromTokens('0', id).then((money) => {
                                            validator.asset = money.asset;
                                            validator.money = money;
                                            validator.apply();
                                            $ngModel.$modelValue = validator.parser($ngModel.$viewValue);
                                        });
                                    }
                                }
                            });

                            this._listenValidatorChanges(name, validator);

                            return validator;
                        }

                        /**
                         * @param name
                         * @private
                         */
                        _createSimpleValidator(name) {
                            const validator = {
                                name,
                                value: null,
                                handler: function (modelValue) {
                                    return validateService[name](modelValue, validator.value);
                                }
                            };

                            this._listenValidatorChanges(name, validator);

                            return validator;
                        }

                        /**
                         * @param name
                         * @param validator
                         * @private
                         */
                        _listenValidatorChanges(name, validator) {
                            const attrValue = $attrs[Validate._getAttrName(name)];

                            if (Validate._hasExp(attrValue)) {
                                const exp = attrValue.replace(/{{(.*)?}}/g, '$1');

                                if (exp.indexOf('::') !== -1) {
                                    validator.value = $scope.$eval(exp.replace('::', ''));
                                } else {
                                    $scope.$watch(exp, (value) => {
                                        validator.value = value;
                                        this._validateByName(validator.name);
                                    });
                                }

                            } else {
                                validator.value = attrValue;
                            }
                        }

                        static _toString(value) {
                            if (value instanceof BigNumber) {
                                return value.toFixed();
                            } else if (value instanceof Waves.Money) {
                                return value.getTokens().toFixed();
                            } else if (!value) {
                                return '';
                            } else {
                                return String(value);
                            }
                        }

                        static _toMoney(value, target) {
                            if (!target) {
                                return null;
                            } else {
                                return target.cloneWithTokens(utils.parseNiceNumber(value));
                            }
                        }

                        /**
                         * @param value
                         * @return {boolean}
                         * @private
                         */
                        static _hasExp(value) {
                            if (!value) {
                                return false;
                            }

                            const openIndex = value.indexOf('{{');
                            const closeIndex = value.indexOf('}}');
                            return openIndex !== -1 && closeIndex !== -1 && openIndex < closeIndex;
                        }

                        /**
                         * @param validatorName
                         * @return {string}
                         * @private
                         */
                        static _getAttrName(validatorName) {
                            return `wValidator${validatorName.charAt(0).toUpperCase()}${validatorName.slice(1)}`;
                        }

                        /**
                         * @param name
                         * @return {boolean}
                         * @private
                         */
                        static _hasValidator(name) {
                            return Validate._getAttrName(name) in $attrs;
                        }

                    }

                    return new Validate();
                };
            }
        };
    };

    directive.$inject = ['utils', 'validateService', 'waves'];

    angular.module('app.utils').directive('wValidate', directive);

})();

