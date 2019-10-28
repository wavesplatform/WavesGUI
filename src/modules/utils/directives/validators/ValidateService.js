/* eslint-disable default-case,no-unused-vars */
(function () {
    'use strict';

    const { BigNumber } = require('@waves/bignumber');

    /**
     * @param {Waves} waves
     * @param {$q} $q
     * @param {Object.<string, {function} isValidAddress>} outerBlockchains
     * @param {app.utils} utils
     * @param {User} user
     * @return {ValidateService}
     */
    const factory = function (waves, $q, outerBlockchains, utils, user) {

        const fetchAliases = utils.cache(
            {},
            waves.node.aliases.getByIdList,
            (item) => item,
            1000,
            item => result => result.find(res => res && res.alias === item));

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
                return dec ? precision.gte(dec.length) : true; // TODO remove empty zero
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

            /**
             * @param {string[]} addressList
             * @param {'no-self'} [value]
             * @return {Promise<boolean>}
             */
            wavesAddresses(addressList, value) {

                const data = addressList.map((item, i) => {
                    return {
                        alias: item,
                        address: item,
                        index: i,
                        isAddress: this.address(item, value),
                        isValidAlis: this.isValidAlias(item)
                    };
                });

                const aliases = data.filter(item => !item.isAddress || item.isValidAlis);
                return fetchAliases(aliases.map(item => item.alias)).then(result => {
                    aliases.forEach((item, index) => {
                        if (result[index] && result[index].address) {
                            item.address = result[index].address;
                            item.isValidAlis = true;
                        } else {
                            item.isValidAlis = false;
                        }
                    });

                    return data.map(item => ({ state: item.isValidAlis || item.isAddress, ...item }));
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
             * @param {string} alias
             * @return {boolean}
             */
            isValidAlias(alias) {
                return waves.node.aliases.validate(alias || '');
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

                if (address.length > WavesApp.maxAddressLength) {
                    return false;
                }

                if (!waves.node.isValidAddress(address)) {
                    return false;
                }

                if (value && value === 'no-self' && address === user.address) {
                    return false;
                }

                return true;
            }

            getByteFromString(str) {
                return new Blob([str], { type: 'text/plain' }).size;
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
                        } else if (item instanceof ds.wavesDataEntities.Money) {
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
