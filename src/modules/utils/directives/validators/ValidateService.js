(function () {
    'use strict';

    const factory = function () {

        class ValidateService {

            @notNullArgs
            @toBigNumberArgs
            gt(inputValue, validateValue) {
                return inputValue.gt(validateValue);
            }

            @notNullArgs
            @toBigNumberArgs
            gte(inputValue, validateValue) {
                return inputValue.gte(validateValue);
            }

            @notNullArgs
            @toBigNumberArgs
            lt(inputValue, validateValue) {
                return inputValue.lt(validateValue);
            }

            @notNullArgs
            @toBigNumberArgs
            lte(inputValue, validateValue) {
                return inputValue.lte(validateValue);
            }

            @notNullArgs
            length(inputValue, length) {
                return String(inputValue).length <= length;
            }

            @notNullArgs
            @toBigNumberArgs
            precision(inputValue, precision) {
                const [int, dec] = inputValue.toFixed().split('.'); //TODO add separator
                return dec ? dec.length <= precision : true; //TODO remove empty zero
            }

            @notNullArgs
            byte(inputValue, bytes) {
                const blob = new Blob([inputValue], { type: 'text/html' });
                return blob.size <= bytes;
            }

            @notNullArgs
            integer(inputValue) {
                return inputValue.round().eq(inputValue);
            }

            static toBigNumber(item) {
                switch (typeof item) {
                    case 'string':
                    case 'number':
                        return new BigNumber(item);
                    case 'object':
                        if (item instanceof BigNumber) {
                            return item;
                        } else if (item instanceof Waves.Money) {
                            return item.getTokens();
                        } else {
                            throw new Error('Cant convert data to BigNumber');
                        }
                }
            }

        }

        function notNullArgs(target, key, descriptor) {
            const origin = descriptor.value;
            descriptor.value = function (...args) {
                if (args.some((value) => value == null || value === '')) {
                    return true;
                } else {
                    return origin.call(this, ...args);
                }
            };
        }

        function toBigNumberArgs(target, key, descriptor) {
            const origin = descriptor.value;
            descriptor.value = function (...args) {
                return origin.call(this, ...args.map(ValidateService.toBigNumber));
            };
        }

        return new ValidateService();
    };

    factory.$inject = [];

    angular.module('app.utils').factory('validateService', factory);
})();
