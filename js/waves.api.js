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
				return URL + '/addresses/';
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
		}

	};


    return Waves;
}(Waves || {}, jQuery));