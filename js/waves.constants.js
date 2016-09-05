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

var Waves = (function (Waves, $) {
    Waves.constants = {
        "RAW_ADDRESS_LENGTH" : 35,
        "ADDRESS_PREFIX": "1W",
        "MAINNET_ADDRESS_REGEXP": /^[a-zA-Z0-9]{35}$/,

        "INITIAL_NONCE": 0,
    };

    if (Waves.UI === undefined)
        Waves.UI = {};

    Waves.UI.constants = {
        'MINIMUM_PAYMENT_AMOUNT' : 1e-8,
        'MINIMUM_TRANSACTION_FEE' : 0.001,
        'AMOUNT_DECIMAL_PLACES' : 8
    }

    function getKeyByValue(map, value) {
        for (var key in map) {
            if (map.hasOwnProperty(key)) {
                if (value === map[key]) {
                    return key;
                }
            }
        }
        return null;
    }

    return Waves;
}(Waves || {}, jQuery));
