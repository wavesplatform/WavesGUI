/******************************************************************************
 * Copyright © 2016 The Waves Developers.                                *
 *                                                                            *
 * See the LICENSE files at                                                   *
 * the top-level directory of this distribution for the individual copyright  *
 * holder information and the developer policies on copyright and licensing.  *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * Waves software, including this file, may be copied, modified, propagated,  *
 * or distributed except according to the terms contained in the LICENSE      *
 * file.                                                                      *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/
/**
 * @depends {waves.constants.js}
 */

function WaveAddress(rawAddress) {
    if (rawAddress === undefined)
        throw new Error("Address must be defined");
    
    this.rawAddress = rawAddress;
    
    this.getRawAddress = function () { return rawAddress; }
        
    this.getDisplayAddress = function() { return Waves.constants.ADDRESS_PREFIX + rawAddress; }
}

var Waves = (function (Waves, $, undefined) {
    "use strict";

    Waves.Addressing = {
        fromDisplayToRaw: function(displayAddress) {
            var address = displayAddress;
            if (address.length > Waves.constants.RAW_ADDRESS_LENGTH || address.startsWith(Waves.constants.ADDRESS_PREFIX))
                address = address.substr(Waves.constants.ADDRESS_PREFIX.length, address.length - Waves.constants.ADDRESS_PREFIX.length);

            return address;
        },
        validateRawAddress: function(rawAddress) {
            return Waves.constants.MAINNET_ADDRESS_REGEXP.test(rawAddress);
        },
        validateDisplayAddress: function(displayAddress) {
            var address = this.fromDisplayToRaw(displayAddress);

            return this.validateRawAddress(address);
        },
        fromRawAddress: function(rawAddress) {
            if (!this.validateRawAddress(rawAddress))
                throw new Error("Raw address is malformed");

            return new WaveAddress(rawAddress);
        },
        fromDisplayAddress: function(displayAddress) {
            if (!this.validateDisplayAddress(displayAddress))
                throw new Error("Display address is malformed");

            return new WaveAddress(this.fromDisplayToRaw(displayAddress));
        }
    };
    
    return Waves;
}(Waves || {}, jQuery));