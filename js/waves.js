
/**
 * @depends {3rdparty/jquery-2.1.0.js}
 * @depends {3rdparty/bootstrap.js}
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/growl.js}
 * @depends {crypto/curve25519.js}
 * @depends {crypto/curve25519_.js}
 * @depends {crypto/base58.js}
 * @depends {crypto/blake32.js}
 * @depends {crypto/keccak32.js}
 * @depends {crypto/passphrasegenerator.js}
 * @depends {crypto/sha256worker.js}
 * @depends {crypto/3rdparty/cryptojs/aes.js}
 * @depends {crypto/3rdparty/cryptojs/sha256.js}
 * @depends {crypto/3rdparty/jssha256.js}
 * @depends {crypto/3rdparty/seedrandom.js}
 * @depends {util/converters.js}
 * @depends {util/extensions.js}
 */
var Waves = (function(Waves, $, undefined) {
	"use strict";

    Waves.server = 'http://82.165.138.42:6869'; //Enter your node or localhost here.
    Waves.epoch = 1460678400;
    Waves.seed = '';
    Waves.hasLocalStorage = _checkDOMenabled();
    var stateInterval;
	var stateIntervalSeconds = 30;

    Waves.createAccount = function (publicKey) {

        $.getJSON(Waves.server+'/waves/address/'+publicKey, function(response) {

            return callback(response);

        });

    }

    Waves.getAddressesBalance = function (address, callback) {

        $.getJSON(Waves.server+'/addresses/balance/'+address, function(response) {

            return callback(response);

        });

    }

	return Waves;
}(Waves || {}, jQuery));

function _checkDOMenabled() {
    var storage;
    var fail;
    var uid;
    try {
        uid = String(new Date());
        (storage = window.localStorage).setItem(uid, uid);
        fail = storage.getItem(uid) != uid;
        storage.removeItem(uid);
        fail && (storage = false);
    } catch (exception) {
    }
    return storage;
}