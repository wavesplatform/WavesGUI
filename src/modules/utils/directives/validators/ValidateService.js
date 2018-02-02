(function () {
    'use strict';

    /**
     * @param {Waves} waves
     * @param {$q} $q
     * @param {Object.<string, {function} isValidAddress>} outerBlockchains
     * @param {app.utils} utils
     * @return {ValidateService}
     */
    const factory = function (waves, $q, outerBlockchains, utils) {

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
            precision(inputValue, precision) {
                const [int, dec] = inputValue.split('.'); //TODO add separator
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

            anyAddress(address, assetId) {
                return this.outerBlockchains(address, assetId) ? true : this.wavesAddress(address);
            }

            wavesAddress(address) {
                return utils.whenAll([
                    this.alias(address),
                    this.address(address)
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

            alias(address) {
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
                } else {
                    return waves.node.aliases.getAddress(address);
                }
            }

            address(address) {
                if (!address) {
                    return true;
                }

                if (address.length <= WavesApp.maxAliasLength) {
                    return false;
                }

                if (address.length >= WavesApp.maxAddressLength) {
                    return false;
                }

                return Waves.API.Node.v1.addresses.balance(address)
                    .then((data) => {
                        if (data && data.balance != null) {
                            return $q.resolve();
                        } else {
                            return $q.reject();
                        }
                    }, (e) => {
                        return $q.reject(e.message);
                    });
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

    factory.$inject = ['waves', '$q', 'outerBlockchains', 'utils'];

    angular.module('app.utils').factory('validateService', factory);
})();
