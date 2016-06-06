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
function WavesAddress(rawAddress) {

    Waves.addressOptions = {
        'devel': function () {
            if (!Waves.constants.TESTNET_ADDRESS_REGEXP.test(rawAddress))
            throw new Error('address is malformed');

        }, 
        '0.2.x': function() {
            if (!Waves.constants.MAINNET_ADDRESS_REGEXP.test(rawAddress))
            throw new Error('address is malformed');
        }
    }


    if (rawAddress !== undefined) {

        Waves.addressOptions[Waves.network]();

        this.rawAddress = rawAddress;
    }

    this.prefix = '1W';
}

WavesAddress.prototype.getDisplayAddress = function () { return this.prefix + this.rawAddress; }

WavesAddress.prototype.getRawAddress = function() { return this.rawAddress; }

WavesAddress.prototype.fromDisplayAddress = function(displayAddress) {
    if (displayAddress.startsWith(this.prefix))
        displayAddress = displayAddress.substr(this.prefix.length, displayAddress.length - this.prefix.length);

    return new WavesAddress(displayAddress);
}

WavesAddress.prototype.fromRawAddress = function(rawAddress) {
    return new WavesAddress(rawAddress);
}