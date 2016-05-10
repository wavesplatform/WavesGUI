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
 * @depends {waves.js}
 */
var Waves = (function (Waves, $) {
    Waves.constants = {
        'DB_VERSION': 2,

        'PLUGIN_VERSION': 1,
        'MAX_SHORT_JAVA': 32767,
        'MAX_UNSIGNED_SHORT_JAVA': 65535,
        'MAX_INT_JAVA': 2147483647,
        'MIN_PRUNABLE_MESSAGE_LENGTH': 28,
        'DISABLED_API_ERROR_CODE': 16,

        "REQUEST_TYPES": {},
        "API_TAGS": {},

        'SERVER': {},
        'GENESIS': '',
        'EPOCH_BEGINNING': 0,
        'FORGING': 'forging',
        'NOT_FORGING': 'not_forging',
        'UNKNOWN': 'unknown'
    };


    Waves.loadServerConstants = function () {
        Waves.sendRequest("getConstants", {}, function (response) {
            if (response.genesisAccountId) {
                Waves.constants.SERVER = response;
                Waves.constants.MIN_BALANCE_MODELS = response.minBalanceModels;
                Waves.constants.GENESIS = response.genesisAccountId;
                Waves.constants.EPOCH_BEGINNING = response.epochBeginning;
                Waves.constants.REQUEST_TYPES = response.requestTypes;
                Waves.constants.API_TAGS = response.apiTags;
                Waves.constants.DISABLED_APIS = response.disabledAPIs;
                Waves.constants.DISABLED_API_TAGS = response.disabledAPITags;
                Waves.loadTransactionTypeConstants(response);
            }
        }, false);
    };

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

    Waves.isRequireBlockchain = function(requestType) {
        if (!Waves.constants.REQUEST_TYPES[requestType]) {
            // For requests invoked before the getConstants request returns,
            // we implicitly assume that they do not require the blockchain
            return false;
        }
        return true == Waves.constants.REQUEST_TYPES[requestType].requireBlockchain;
    };

    Waves.isRequirePost = function(requestType) {
        if (!Waves.constants.REQUEST_TYPES[requestType]) {
            // For requests invoked before the getConstants request returns
            // we implicitly assume that they can use GET
            return false;
        }
        return true == Waves.constants.REQUEST_TYPES[requestType].requirePost;
    };

    Waves.isRequestTypeEnabled = function(requestType) {
        if ($.isEmptyObject(Waves.constants.REQUEST_TYPES)) {
            return true;
        }
        if (requestType.indexOf("+") > 0) {
            requestType = requestType.substring(0, requestType.indexOf("+"));
        }
        return !!Waves.constants.REQUEST_TYPES[requestType];
    };

    Waves.isSubmitPassphrase = function (requestType) {
        return requestType == "startForging" ||
            requestType == "stopForging" ||
            requestType == "startShuffler" ||
            requestType == "getForging" ||
            requestType == "markHost";
    };

    Waves.isApiEnabled = function(depends) {
        if (!depends) {
            return true;
        }
        var tags = depends.tags;
        if (tags) {
            for (var i=0; i < tags.length; i++) {
                if (!tags[i].enabled) {
                    return false;
                }
            }
        }
        var apis = depends.apis;
        if (apis) {
            for (i=0; i < apis.length; i++) {
                if (!apis[i].enabled) {
                    return false;
                }
            }
        }
        return true;
    };

    return Waves;
}(Waves || {}, jQuery));