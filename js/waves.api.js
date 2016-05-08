/**
 * @depends {waves.js}
 */
var Waves = (function (Waves, $) {
	'use strict';

	var URL = Waves.server;
					
	Waves.api = {
		version: URL + '/scorex/version',
		status: URL + '/scorex/status',
		blocks: {
			height: URL + '/blocks/height',
			seq: function (from, to) {
				return URL + '/blocks/seq/' + from + '/' + to;
			},
			byHeight: function (height) {
				return URL + '/blocks/at/' + height;
			},
			bySignature: function (signature) {
				return URL + '/blocks/signature/' + signature;
			}
		},
		address: {
			getAddresses: function () {
				return URL + '/addresses';
			},
			balance: function (address) {
				return URL + '/addresses/balance/' + address;
			},
			generatingBalance: function (address) {
				return URL + '/addresses/generatingbalance/' + address;
			},
			validate: function (address) {
				return URL + '/addresses/validate/' + address;
			}
		},
		transactions: {
			unconfirmed: URL + '/transactions/unconfirmed',
			info: function (signature) {
				return URL + '/transactions/info/' + signature;
			},
			forAddress: function (address) {
				return URL + '/transactions/address/' + address + '/limit/50';
			}

		},
		consensus: {
			puz: URL + '/consensus/puz',
			algo: URL + '/consensus/algo',
			basetarget: URL + '/consensus/basetarget'
		},
		peers: {
			all: URL + '/peers/all',
			connected: URL + '/peers/connected'
		},
		waves: {
			address: URL + '/waves/address'
		}

	};


	Waves.apiRequest = function(url, data, callback, async) {

		var _type = 'GET';

		if ($.isFunction(data)) {
            async = callback;
            callback = data;
            data = {};
        } else {
            data = data || {};
        }

        if(url === Waves.api.waves.address) {
        	_type = 'POST';
        }

        $.support.cors = true;

        $.ajax({
            url: url,
            crossDomain: true,
            dataType: "json",
            type: _type,
            timeout: 30000,
            async: (async === undefined ? true : async),
            data: data
        }).done(function (json) {
            //why is this necessary??..
            if (json.errorCode && !json.errorDescription) {
                json.errorDescription = (json.errorMessage ? json.errorMessage : $.t("server_error_unknown"));
            }
            if (callback) {
                callback(json, data);
            }
        }).fail(function (xhr, textStatus, error) {
            if (callback) {
                callback({
                    "errorCode": -1,
                    "errorDescription": error
                }, {});
            }
        });

	}


    return Waves;
}(Waves || {}, jQuery));