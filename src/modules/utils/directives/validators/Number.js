(function () {
    'use strict';

    const factory = function (Validator, utils) {

        class Number extends Validator {

            constructor(data) {
                super(data);

                const numberReg = /[0-9]/;

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
                const isRequired = this.$input.get(0)
                    .hasAttribute('required');

                this.registerValidator('required', (modelValue) => {
                    return !isRequired || !!modelValue;
                });

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

        }

        return Number;
    };

    factory.$inject = ['Validator', 'utils'];

    angular.module('app.utils').factory('Number', factory);
})();
