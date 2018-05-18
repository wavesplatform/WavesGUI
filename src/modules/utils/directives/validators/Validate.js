/* global tsUtils, BigNumber */
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
        'byteLt',
        'byteLte',
        'byteGt',
        'byteGte',
        'number',
        'asset',
        'compare',
        'alias',
        'address',
        'wavesAddress',
        'outerBlockchains',
        'anyAddress',
        'pattern',
        'custom'
    ];

    const PATTERNS = {
        get NUMBER() {
            const decimal = WavesApp.getLocaleData().separators.decimal;
            return `\\d*\\${decimal}?\\d*`;
        },
        INTEGER: '\\d*'
    };

    /**
     *
     * @param {app.utils} utils
     * @param {ValidateService} validateService
     * @param {app.utils.decorators} decorators
     * @param {$rootScope.Scope} $rootScope
     * @param {$compile} $compile
     * @param {Base} Base
     */
    const directive = function (utils, validateService, decorators, $rootScope, $compile, Base) {
        return {
            require: 'ngModel',
            priority: 10000,
            /**
             * @param {JQuery} $input
             * @param {object} $attrs
             * @return {*}
             */
            compile: function ($input, $attrs) {

                /**
                 * $input can be both <input> and <w-input>, in the latter case we should ignore validation
                 */
                if ($input.get(0).tagName !== 'INPUT' && $input.get(0).tagName !== 'TEXTAREA') {
                    return null;
                }

                /**
                 * @param {$rootScope.Scope}
                 * @prarm {JQuery} $input
                 */
                return function ($scope, $input, $compiledAttrs, $ngModel) {

                    class Validate extends Base {

                        constructor() {
                            super($scope);
                            this._validators = Object.create(null);
                            /**
                             * @type {Signal}
                             * @private
                             */
                            this._validatorsReady = new tsUtils.Signal();
                            this._ready = false;

                            this._validatorsReady.once(() => {
                                this._ready = true;
                            });

                            this._createValidatorList();
                            $scope.$watch($attrs.ngModel, () => this._validate());
                        }

                        _addInputPattern(pattern) {
                            return new Promise((resolve) => {
                                const create = () => {
                                    const validatorName = 'pattern';
                                    const patternName = Validate._getAttrName(validatorName);
                                    if (!$attrs[patternName]) {
                                        $attrs[patternName] = pattern;
                                        resolve(this._createValidator(validatorName));
                                    }
                                };

                                if (this._ready) {
                                    create();
                                } else {
                                    this.receiveOnce(this._validatorsReady, create);
                                }
                            });
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
                                                $scope.$digest();
                                            };
                                            utils.when(result).then(() => {
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
                        @decorators.async()
                        _validate() {
                            this._applyValidators(Object.keys(this._validators).map((name) => this._validators[name]));
                            $scope.$digest();
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

                            this._validatorsReady.dispatch();
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
                                case 'compare':
                                    this._validators[name] = this._createCompareValidator(name);
                                    break;
                                case 'custom':
                                    this._validators[name] = this._createCustomValidator(name);
                                    break;
                                case 'number':
                                    this._validators[name] = this._createBigNumberValidator(name);
                                    break;
                                case 'alias':
                                case 'address':
                                case 'wavesAddress':
                                    this._validators[name] = this._createAddressValidator(name);
                                    break;
                                case 'integer':
                                    this._validators[name] = this._createIntegerValidator(name);
                                    break;
                                case 'anyAddress':
                                    this._validators[name] = this._createAnyAddressValidator(name);
                                    break;
                                case 'outerBlockchains':
                                    this._validators[name] = this._createOuterBlockchainsValidator(name);
                                    break;
                                case 'pattern':
                                    this._validators[name] = this._createPatternValidator(name);
                                    break;
                                case 'byteLt':
                                case 'byteLte':
                                    this._validators[name] = this._createByteValidator(name);
                                    break;
                                default:
                                    this._validators[name] = this._createSimpleValidator(name);
                            }

                            if (this._validators[name].parser) {
                                $ngModel.$parsers.unshift(this._validators[name].parser);
                            }

                            if (this._validators[name].formatter) {
                                $ngModel.$formatters.push(this._validators[name].formatter);
                            }


                            return this._validators[name];
                        }

                        _createCustomValidator(name) {

                            const validator = {
                                name,
                                value: null,
                                handler: function () {
                                    if (validator.value == null) {
                                        return true;
                                    } else if (typeof validator.value === 'function') {
                                        return validator.value();
                                    } else {
                                        return !!validator.value;
                                    }
                                }
                            };

                            this._listenValidatorChanges(name, validator);

                            return validator;
                        }

                        _createIntegerValidator(name) {
                            this._addInputPattern(PATTERNS.INTEGER);

                            return {
                                name,
                                value: null,
                                handler: (modelValue) => {
                                    try {
                                        const num = Validate._toBigNumber(modelValue);
                                        return !modelValue || num.round(0).eq(Validate._toBigNumber(modelValue));
                                    } catch (e) {
                                        return false;
                                    }
                                }
                            };
                        }

                        _createOuterBlockchainsValidator(name) {

                            let value = null;

                            const validator = {
                                name,
                                value: null,
                                handler: function (address) {
                                    return validateService.outerBlockchains(address, validator.value);
                                }
                            };

                            Object.defineProperty(validator, 'value', {
                                get: () => value,
                                set: (data) => {
                                    value = Validate._toAssetId(data);
                                }
                            });

                            this._listenValidatorChanges(name, validator);

                            return validator;
                        }

                        _createAnyAddressValidator(name) {

                            let value = null;

                            const validator = {
                                name,
                                value: null,
                                handler: function (address) {
                                    return validateService.anyAddress(address, validator.value);
                                }
                            };

                            Object.defineProperty(validator, 'value', {
                                get: () => value,
                                set: (data) => {
                                    value = Validate._toAssetId(data);
                                }
                            });

                            this._listenValidatorChanges(name, validator);

                            return validator;
                        }

                        _createCompareValidator(name) {

                            let value = null;

                            const validator = {
                                name,
                                value: null,
                                $compare: null,
                                $compareHandler: () => {
                                    this._validateByName(name);
                                    $scope.$apply();
                                },
                                handler: (value) => {
                                    return value === validator.$compare.val();
                                },
                                destroy: function () {
                                    this.$compare.off('input', this.$compareHandler);
                                }
                            };

                            Object.defineProperty(validator, 'value', {
                                get: () => value,
                                set: (val) => {
                                    if (utils.isNotEqualValue(value, val)) {
                                        if (validator.$compare) {
                                            validator.$compare.off('input', validator.$compareHandler);
                                        }
                                        validator.$compare = $input.closest('form').find(`input[name="${val}"]`);
                                        validator.$compare.on('input', validator.$compareHandler);
                                        value = val;
                                    }
                                }
                            });

                            this._listenValidatorChanges(name, validator);

                            return validator;
                        }

                        _createPatternValidator(name) {
                            let value;
                            let parserWorkedBeforeInputEvent = false;

                            function getCorrespondingToPatternPartOf(value) {
                                const inputWithoutGroup = Validate._replaceGroupSeparator(value);
                                const correspondingParts = validator.value.exec(inputWithoutGroup) || [];

                                return correspondingParts[0] || '';
                            }

                            const validator = {
                                name,
                                value: null,
                                handler: () => {
                                    return true; // TODO
                                },
                                parser: (value) => {
                                    const correspondingToPatternPartOfInput = getCorrespondingToPatternPartOf(value);

                                    if (correspondingToPatternPartOfInput !== value) {
                                        Validate._replaceInputValue(correspondingToPatternPartOfInput);
                                    }

                                    parserWorkedBeforeInputEvent = true;

                                    return correspondingToPatternPartOfInput;
                                }
                            };

                            Object.defineProperty(validator, 'value', {
                                get: () => value,
                                set: (val) => {
                                    value = new RegExp(val);
                                }
                            });

                            // Once there is empty or invalid value in an input, parsers do not always run, thus there
                            // is a need for clearing the wrong state of the input.
                            $input.on('input', () => {
                                if (parserWorkedBeforeInputEvent) {
                                    parserWorkedBeforeInputEvent = false;
                                } else {
                                    Validate._replaceInputValue(
                                        getCorrespondingToPatternPartOf($input.val())
                                    );
                                }
                            });

                            this._listenValidatorChanges(name, validator);

                            return validator;
                        }

                        /**
                         *
                         * @param name
                         * @return {*}
                         * @private
                         */
                        _createAssetValidator(name) {
                            const precisionValidator = this._createValidator('precision');

                            this._addInputPattern(PATTERNS.NUMBER).then((validator) => {
                                this.listenEventEmitter(i18next, 'languageChanged', () => {
                                    validator.value = PATTERNS.NUMBER;
                                });
                            });

                            let value = null;

                            const validator = {
                                name,
                                money: null,
                                value: null,
                                apply: () => {
                                    precisionValidator.value = validator.money.asset.precision;
                                    this._validateByName(name);
                                    this._validateByName(precisionValidator.name);
                                },
                                handler: () => {
                                    return true; // Can't write no number values! :)
                                },
                                parser: (value) => {
                                    if (value && precisionValidator.handler($ngModel.$modelValue, value)) {
                                        const money = Validate._toMoney(value, validator.money);
                                        if (money) {
                                            return money;
                                        } else {
                                            this._validateByName('asset');
                                            return null;
                                        }
                                    } else {
                                        return null;
                                    }
                                },
                                formatter: (value) => {

                                    const viewValue = $input.val();
                                    const money = precisionValidator.handler($ngModel.$modelValue, viewValue) &&
                                        Validate._toMoney(viewValue, validator.money);

                                    if (Validate._isFocused() && (!value || (money && money.eq(value)))) {
                                        return $input.val();
                                    } else {
                                        return Validate._toString(value);
                                    }
                                }
                            };

                            $input.on('input', () => {
                                this._validateByName(precisionValidator.name);
                                $scope.$apply();
                            });

                            Object.defineProperty(validator, 'value', {
                                get: () => value,
                                set: (assetData) => {

                                    validator.money = null;

                                    if (!assetData) {
                                        return null;
                                    }

                                    value = Validate._toAssetId(assetData);
                                    if (value) {
                                        Waves.Money.fromTokens('0', value).then((money) => {
                                            if (utils.isNotEqualValue(validator.money, money)) {
                                                validator.money = money;
                                                validator.apply();
                                                $ngModel.$modelValue = validator.parser($ngModel.$viewValue);
                                            }
                                        });
                                    }
                                }
                            });

                            this._listenValidatorChanges(name, validator);

                            return validator;
                        }

                        _createAddressValidator(name) {
                            const validator = {
                                name,
                                value: null,
                                handler: (value) => validateService[name](value, validator.value)
                            };
                            this._listenValidatorChanges(name, validator);

                            return validator;
                        }

                        _createByteValidator(name) {
                            const validator = this._createSimpleValidator(name);
                            const $byteScope = $rootScope.$new(true);
                            const attrs = [
                                'w-i18n-ns="app.utils"',
                                'class="byte-validator__help"',
                                'w-i18n="validators.byte.help"',
                                'params="{bytes: bytes}"'
                            ];
                            const $element = $compile(`<div ${attrs.join(' ')}></div>`)($byteScope);
                            $input.after($element);
                            $scope.$on('$destroy', () => {
                                $byteScope.$destroy();
                            });

                            const origin = validator.handler;
                            validator.handler = function (modelValue) {
                                const stringBytes = validateService.getByteFromString(modelValue || '');
                                $byteScope.bytes = Number(validator.value) - stringBytes;
                                $byteScope.$digest();
                                return origin(modelValue);
                            };

                            return validator;
                        }

                        /**
                         * @param name
                         * @private
                         */
                        _createSimpleValidator(name) {

                            let handler;
                            switch (name) {
                                case 'precision':
                                    handler = function (modelValue, viewValue) {
                                        let value;

                                        try {
                                            if (viewValue) {
                                                value = utils.parseNiceNumber(viewValue);
                                            } else {
                                                value = null;
                                            }
                                        } catch (e) {
                                            value = null;
                                        }

                                        return validateService[name](value, validator.value);
                                    };
                                    break;
                                default:
                                    handler = function (modelValue) {
                                        return validateService[name](modelValue, validator.value);
                                    };
                            }

                            const validator = {
                                name,
                                value: null,
                                handler
                            };

                            this._listenValidatorChanges(name, validator);

                            return validator;
                        }

                        _createBigNumberValidator(name) {
                            this._addInputPattern(PATTERNS.NUMBER);

                            return {
                                name,
                                handler: () => true,
                                parser: (value) => {
                                    if (value === '') {
                                        return;
                                    }

                                    return Validate._toBigNumber(value);
                                },
                                formatter: Validate._toString
                            };
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

                        static _isFocused() {
                            return document.activeElement === $input.get(0);
                        }

                        static _toAssetId(data) {
                            if (typeof data === 'string') {
                                return data;
                            } else if (data instanceof Waves.Money) {
                                return data.asset.id;
                            } else if (data instanceof Waves.Asset) {
                                return data.id;
                            } else {
                                return null;
                            }
                        }

                        static _toString(value) {
                            if (value instanceof BigNumber) {
                                return value.toFixed();
                            } else if (value instanceof Waves.Money) {
                                return value.getTokens().toFormat();
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
                                try {
                                    return target.cloneWithTokens(utils.parseNiceNumber(value));
                                } catch (e) {
                                    return null;
                                }
                            }
                        }

                        static _toBigNumber(value) {
                            try {
                                return new BigNumber(utils.parseNiceNumber(value));
                            } catch (e) {
                                return null;
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

                        /**
                         * @param newValue
                         * @private
                         */
                        static _replaceInputValue(newValue) {
                            $ngModel.$viewValue = newValue;
                            $ngModel.$render();
                        }

                        /**
                         * @param {string} value
                         * @return {string}
                         * @private
                         */
                        static _replaceGroupSeparator(value) {
                            const separator = WavesApp.localize[i18next.language].separators.group;
                            const reg = new RegExp(`\\${separator}`, 'g');
                            return value.replace(reg, '');
                        }

                    }

                    return new Validate();
                };
            }
        };
    };

    directive.$inject = ['utils', 'validateService', 'decorators', '$rootScope', '$compile', 'Base'];

    angular.module('app.utils').directive('wValidate', directive);

})();

