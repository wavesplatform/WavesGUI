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
    if (rawAddress === undefined)
        throw new Error('address must be defined');
    
    if (!Waves.constants.TESTNET_ADDRESS_REGEXP.test(rawAddress))
        throw new Error('address is malformed');

    this.rawAddress = rawAddress;
    this.prefix = '1w';
}

WavesAddress.prototype.getDisplayAddress = function () { return this.prefix + this.rawAddress; }

WavesAddress.prototype.getRawAddress = function() { return this.rawAddress; }