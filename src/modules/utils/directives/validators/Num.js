(function () {
    'use strict';

    const factory = function (Validator, utils) {
        // TODO rename all validators (add postfix "Validator")
        class Num extends Validator {

            constructor(data) {
                super(data);

                /**
                 * @type {RegExp}
                 */
                const numberReg = /[0-9]/;
                /**
                 * @type {HTMLInputElement}
                 */
                const input = this.$input.get(0);

                /**
                 * @param {string} char
                 * @param {boolean} hasDot
                 * @return {boolean}
                 */
                const checkChar = (char, hasDot) => {
                    if (char === '.') {
                        return !hasDot;
                    } else {
                        return numberReg.test(char);
                    }
                };

                /**
                 * @type {boolean}
                 */
                const isRequired = input.hasAttribute('required');
                /**
                 * @type {boolean}
                 */
                const isInteger = input.hasAttribute('integer');
                /**
                 * @type {boolean}
                 */
                const hasMax = input.hasAttribute('max');
                /**
                 * @type {boolean}
                 */
                const hasMin = input.hasAttribute('min');
                /**
                 * @type {boolean}
                 */
                const includeRangeMin = input.hasAttribute('include-range-min');
                /**
                 * @type {boolean}
                 */
                const includeRangeMax = input.hasAttribute('include-range-max');
                /**
                 * @type {boolean}
                 */
                const hasPrecision = input.hasAttribute('precision');

                if (isInteger) {
                    this.registerValidator('integer', (modalValue) => {
                        return !modalValue || modalValue.round(0).eq(modalValue);
                    });
                } else if (hasPrecision) {
                    let precision;
                    this.registerValidator('precision', (modalValue) => {
                        return !modalValue || precision == null || modalValue.eq(modalValue.round(precision));
                    });
                    this.$scope.$watch(this.$attrs.precision, (value) => {
                        precision = Number(value) || 0;
                        this.validateByName('precision');
                    });
                }

                if (hasMin) {
                    let min;
                    if (includeRangeMin) {
                        this.registerValidator('min', (modalValue) => !min || !modalValue || modalValue.gte(min));
                    } else {
                        this.registerValidator('min', (modalValue) => !min || !modalValue || modalValue.gt(min));
                    }

                    this.$scope.$watch(this.$attrs.min, (value) => {
                        min = Num._toBigNumber(value);
                        this.validateByName('min');
                    });
                }

                if (hasMax) {
                    let max;
                    if (includeRangeMax) {
                        this.registerValidator('max', (modalValue) => !max || !modalValue || modalValue.lte(max));
                    } else {
                        this.registerValidator('max', (modalValue) => !max || !modalValue || modalValue.lt(max));
                    }

                    this.$scope.$watch(this.$attrs.max, (value) => {
                        max = Num._toBigNumber(value);
                        this.validateByName('max');
                    });
                }

                this.registerValidator('required', (modelValue) => {
                    return !isRequired || !!modelValue;
                });

                // TODO fix for ff backspace
                this.$input.on('keypress', (event) => {
                    function getChar(event) {
                        if (event.which === null) { // IE
                            if (event.keyCode < 32) return null; // спец. символ
                            return String.fromCharCode(event.keyCode);
                        }

                        if (event.which !== 0 && event.charCode !== 0) { // все кроме IE
                            if (event.which < 32) return null; // спец. символ
                            return String.fromCharCode(event.which); // остальные
                        }

                        return null; // спец. символ
                    }

                    const char = getChar(event);
                    if (!char || !checkChar(char, this.$input.val().indexOf('.') !== -1)) {
                        event.preventDefault();
                    }
                });

            }

            getParser() {
                return utils.parseNiceNumber;
            }

            static _toBigNumber(value) {
                if (!value) {
                    return new BigNumber(0);
                } else if (value instanceof BigNumber) {
                    return value;
                } else {
                    return new BigNumber(value);
                }
            }

        }

        return Num;
    };

    factory.$inject = ['Validator', 'utils'];

    angular.module('app.utils').factory('Num', factory);
})();
