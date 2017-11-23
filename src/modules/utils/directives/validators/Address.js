(function () {
    'use strict';

    const factory = function (Validator) {

        class Address extends Validator {

            constructor(data) {
                super(data);

                this.$ngModel.$asyncValidators.inputAddress = function (address) {
                    // TODO : replace with address validator from `waves-api` when it's implemented
                    return Waves.API.Node.v1.addresses.balance(address)
                        .then((data) => {
                            if (data && data.balance != null) {
                                return Promise.resolve();
                            } else {
                                return Promise.reject();
                            }
                        }, (e) => {
                            return Promise.reject(e.message);
                        });
                };
            }

        }

        return Address;
    };

    factory.$inject = ['Validator'];

    angular.module('app.utils').factory('Address', factory);
})();
