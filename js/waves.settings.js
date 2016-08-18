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
var Waves = (function (Waves) {
    'use strict';

    if (Waves.constants === undefined)
        throw new Error("Incorrect order of scripts inclusion. Waves.settings.js should be included after Waves.constants.js");

    Waves.constants.CLIENT_VERSION = '0.4.1a';
    Waves.constants.NODE_ADDRESS = 'http://52.30.47.67:6869';
    Waves.constants.NETWORK_NAME = 'devel';
    Waves.constants.ADDRESS_VERSION = 1;
    Waves.constants.NETWORK_CODE = 'T';

    return Waves;
}(Waves || {}));
