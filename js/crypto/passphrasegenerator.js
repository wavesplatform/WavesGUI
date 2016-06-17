/******************************************************************************
 * Copyright © 2016 The Waves Core Developers.                             	  *	
 *                                                                            *
 * See the LICENSE files at     											  *
 * the top-level directory of this distribution for the individual copyright  *
 * holder information and the developer policies on copyright and licensing.  *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * Waves software, including this file, may be copied, modified, propagated,  *
 * or distributed except according to the terms contained in the LICENSE.txt  *
 * file.                                                                      *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/

/**
 * @depends {../3rdparty/jquery-2.1.0.js}
 */

var PassPhraseGenerator = {
	seeds: 0,
	seedLimit: 512,

	push: function(seed) {
		Math.seedrandom(seed, true);
		this.seeds++;
	},

	isDone: function() {
		if (this.seeds == this.seedLimit) {
			return true;
		}
		return false;
	},

	percentage: function() {
		return Math.round((this.seeds / this.seedLimit) * 100)
	},

	passPhrase: "",

	wordCount: 2048,

	words: ClientWordList,

	generatePassPhrase: function() {

		var crypto = window.crypto || window.msCrypto;

		bits = 160;

		var random = new Uint32Array(bits / 32);

		crypto.getRandomValues(random);

		var i = 0,
			l = random.length,
			n = this.wordCount,
			words = [],
			x, w1, w2, w3;

		for (; i < l; i++) {
			x = random[i];
			w1 = x % n;
			w2 = (((x / n) >> 0) + w1) % n;
			w3 = (((((x / n) >> 0) / n) >> 0) + w2) % n;

			words.push(this.words[w1]);
			words.push(this.words[w2]);
			words.push(this.words[w3]);
		}

		this.passPhrase = words.join(" ");

		crypto.getRandomValues(random);

		return this.passPhrase;
	},

	reset: function() {
		this.passPhrase = "";
		this.seeds = 0;
	}
}