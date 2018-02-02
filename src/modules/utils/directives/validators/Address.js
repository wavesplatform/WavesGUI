(function () {
    'use strict';

    /**
     * @param Validator
     * @param {Waves} waves
     * @param $q
     * @param outerBlockchains
     * @returns {Address}
     */
    const factory = function (Validator, waves, $q, outerBlockchains) {

        class Address extends Validator {

            constructor(data) {
                super(data);

                const withGateways = this.$attrs.withGateways === 'true';
                const outerChain = outerBlockchains[this.$attrs.assetId];

                this.$ngModel.$asyncValidators.inputAddress = function (address) {
                    if (address.length < WavesApp.minAliasLength) {
                        return $q.reject();
                    } else if (withGateways && outerChain && outerChain.isValidAddress(address)) {
                        return $q.resolve();
                    } else if (address.length <= WavesApp.maxAliasLength) {
                        if (waves.node.aliases.validate(address)) {
                            return waves.node.aliases.getAddress(address)
                                .then(
                                    () => $q.resolve(),
                                    () => $q.reject()
                                );
                        } else {
                            $q.reject();
                        }
                    } else {
                        // TODO : replace with address validator from `waves-api` when it's implemented
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
                };
            }

        }

        return Address;
    };

    factory.$inject = ['Validator', 'waves', '$q', 'outerBlockchains'];

    angular.module('app.utils').factory('Address', factory);
})();
