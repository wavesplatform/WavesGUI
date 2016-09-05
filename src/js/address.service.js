(function () {
    'use strict';

    angular
        .module('app.core.services')
        .service('addressService', ['constants.address', 'cryptoService', function (constants, cryptoService) {

            function WaveAddress(rawAddress) {
                if (rawAddress === undefined)
                    throw new Error('Address must be defined');

                this.getRawAddress = function () { return rawAddress; };

                this.getDisplayAddress = function() { return constants.ADDRESS_PREFIX + rawAddress; };
            }

            this.fromDisplayToRaw = function(displayAddress) {
                var address = displayAddress;
                if (address.length > constants.RAW_ADDRESS_LENGTH || address.startsWith(constants.ADDRESS_PREFIX))
                    address = address.substr(constants.ADDRESS_PREFIX.length,
                        address.length - constants.ADDRESS_PREFIX.length);

                return address;
            };

            this.validateRawAddress = function(rawAddress) {
                return constants.MAINNET_ADDRESS_REGEXP.test(rawAddress);
            };

            this.validateDisplayAddress = function(displayAddress) {
                var address = this.fromDisplayToRaw(displayAddress);

                return this.validateRawAddress(address);
            };

            this.fromRawAddress = function(rawAddress) {
                if (!this.validateRawAddress(rawAddress))
                    throw new Error('Raw address is malformed');

                return new WaveAddress(rawAddress);
            };

            this.fromDisplayAddress = function(displayAddress) {
                if (!this.validateDisplayAddress(displayAddress))
                    throw new Error('Display address is malformed');

                return new WaveAddress(this.fromDisplayToRaw(displayAddress));
            };

            this.buildAddress = function (encodedPublicKey) {
                return this.fromRawAddress(cryptoService.buildRawAddress(encodedPublicKey));
            };
        }]);
})();
