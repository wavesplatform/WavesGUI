/* eslint-disable default-case,no-unused-vars */
(function () {
    'use strict';

    /**
     * @param {Waves} waves
     * @param {$q} $q
     * @param {Object.<string, {function} isValidAddress>} outerBlockchains
     * @param {app.utils} utils
     * @param {User} user
     * @return {ValidateService}
     */
    const factory = function (waves, $q, outerBlockchains, utils, user) {

        class ValidateService {

            @toBigNumberArgs
            @notNullArgs
            gt(inputValue, validateValue) {
                return inputValue.gt(validateValue);
            }

            @toBigNumberArgs
            @notNullArgs
            gte(inputValue, validateValue) {
                return inputValue.gte(validateValue);
            }

            @toBigNumberArgs
            @notNullArgs
            lt(inputValue, validateValue) {
                return inputValue.lt(validateValue);
            }

            @toBigNumberArgs
            @notNullArgs
            lte(inputValue, validateValue) {
                return inputValue.lte(validateValue);
            }

            @notNullArgs
            length(inputValue, length) {
                return String(inputValue).length <= length;
            }

            @toBigNumberArgs
            @notNullArgs
            precision(inputValue, precision) {
                const [int, dec] = inputValue.toFixed().split('.'); // TODO add separator
                return dec ? dec.length <= precision : true; // TODO remove empty zero
            }

            @notNullArgs
            byteLt(inputValue, bytes) {
                return this.getByteFromString(inputValue) < Number(bytes);
            }

            @notNullArgs
            byteLte(inputValue, bytes) {
                return this.getByteFromString(inputValue) <= Number(bytes);
            }

            @notNullArgs
            byteGt(inputValue, bytes) {
                return this.getByteFromString(inputValue) > Number(bytes);
            }

            @notNullArgs
            byteGte(inputValue, bytes) {
                return this.getByteFromString(inputValue) >= Number(bytes);
            }

            @notNullArgs
            integer(inputValue) {
                return inputValue.round().eq(inputValue);
            }

            anyAddress(address, assetId) {
                return this.outerBlockchains(address, assetId) ? true : this.wavesAddress(address);
            }

            /**
             * @param {string} address
             * @param {'no-self'} [value]
             * @return {Promise<boolean>}
             */
            wavesAddress(address, value) {
                return utils.whenAll([
                    this.alias(address, value),
                    this.address(address, value)
                ]).then(([alias = true, address = true]) => {
                    return (alias || address) ? $q.resolve() : $q.reject();
                });
            }

            outerBlockchains(address, assetId) {
                if (!address || !assetId) {
                    return true;
                }

                const outerChain = outerBlockchains[assetId];

                if (!outerChain) {
                    return false;
                }

                return outerChain.isValidAddress(address);
            }

            /**
             * @param {string} address
             * @param {'no-self'} [value]
             * @return {boolean|Promise}
             */
            alias(address, value = undefined) {
                if (!address) {
                    return true;
                }

                if (address.length < WavesApp.minAliasLength) {
                    return false;
                }

                if (address.length > WavesApp.maxAliasLength) {
                    return false;
                }

                if (!waves.node.aliases.validate(address)) {
                    return false;
                } else if (value && value === 'no-self') {
                    return !waves.node.aliases.getAliasList().includes(address) &&
                        waves.node.aliases.getAddress(address);
                } else {
                    return waves.node.aliases.getAddress(address);
                }
            }

            address(address, value = '') {
                if (!address) {
                    return true;
                }

                if (address.length <= WavesApp.maxAliasLength) {
                    return false;
                }

                if (address.length >= WavesApp.maxAddressLength) {
                    return false;
                }

                if (!waves.node.isValidAddress(address)) {
                    return false;
                }

                if (value && value === 'no-self' && address === user.address) {
                    return false;
                }

                return waves.node.assets.getBalanceByAddress(address)
                    .then((data) => {
                        if (data && data.available != null) {
                            return $q.resolve();
                        } else {
                            return $q.reject();
                        }
                    }, (e) => {
                        return $q.reject(e.message);
                    });
            }

            getByteFromString(str) {
                return new Blob([str], { type: 'text/html' }).size;
            }

            static toBigNumber(item) {
                switch (typeof item) {
                    case 'string':
                    case 'number':
                        try {
                            return new BigNumber(item);
                        } catch (e) {
                            return null;
                        }
                    case 'object':
                        if (item instanceof BigNumber) {
                            return item;
                        } else if (item instanceof Waves.Money) {
                            return item.getTokens();
                        } else {
                            return null;
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

        return utils.bind(new ValidateService());
    };

    factory.$inject = ['waves', '$q', 'outerBlockchains', 'utils', 'user'];

    angular.module('app.utils').factory('validateService', factory);
})();
