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

	wordCount: 354896,

	words: ClientWordList,
	generatePassPhrase: function() {

		var crypto = window.crypto || window.msCrypto;

		bits = 128;

		var random = new Uint32Array(bits / 32);

		crypto.getRandomValues(random);

		var i = 0,
			l = random.length,
			n = this.wordCount,
			words = [],
			x, w1, w2, w3;
		Math.seedrandom('WavesLite entropy.', { entropy: true });

		for (; i < l; i++) {
			x = random[i];
			w1 = Math.floor(Math.random() * n);
			w2 = Math.floor(Math.random() * n);
			w3 = Math.floor(Math.random() * n);

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