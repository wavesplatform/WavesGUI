/* blake32.js
 * A Javascript implementation of Jean-Philippe Aumasson's BLAKE32 submission.
 * 
 * This implementation operates on Javascript strings, interpreted as UTF-16BE 
 * encoded (i.e. "\u1234\u5678" --> [0x12, 0x34, 0x56, 0x78], and is therefore
 * restricted to messages which are a multiple of 2 bytes in length. It may 
 * also incorrectly process strings longer than 2^28 == 268 million characters.
 * 
 * These test vectors are given on the BLAKE NIST CD:
 *     ShortMsgKAT_256.txt ::
 *         Len = 0
 *         Msg = 00
 *         MD = 73BE7E1E0A7D0A2F0035EDAE62D4412EC43C0308145B5046849A53756BCDA44B
 *         ...
 *         Len = 16
 *         Msg = 41FB
 *         MD = EC6C0405BCD2CDF2B0A5D50637417E9FC51F6B63D962E80BAF752798A34A77D6
 *         ...
 *         Len = 2000
 *         Msg = B3C5E74B69933C2533106C563B4CA20238F2B6E675E8681E34A389894785BDADE59652D4A73D80A5C85BD454FD1E9FFDAD1C3815F5038E9EF432AAC5C3C4FE840CC370CF86580A6011778BBEDAF511A51B56D1A2EB68394AA299E26DA9ADA6A2F39B9FAFF7FBA457689B9C1A577B2A1E505FDF75C7A0A64B1DF81B3A356001BF0DF4E02A1FC59F651C9D585EC6224BB279C6BEBA2966E8882D68376081B987468E7AED1EF90EBD090AE825795CDCA1B4F09A979C8DFC21A48D8A53CDBB26C4DB547FC06EFE2F9850EDD2685A4661CB4911F165D4B63EF25B87D0A96D3DFF6AB0758999AAD214D07BD4F133A6734FDE445FE474711B69A98F7E2B
 *         MD = B0D9C21E1639827A1BD5263D87C6C545B7F448BB7742E24D45DFA0E83E3ADD65
 *
 * The corresponding Javascript code is:
 *     blake32("")
 *         "73be7e1e0a7d0a2f0035edae62d4412ec43c0308145b5046849a53756bcda44b"
 *     blake32("\u41fb")
 *         "ec6c0405bcd2cdf2b0a5d50637417e9fc51f6b63d962e80baf752798a34a77d6"
 *     blake32("\ub3c5\ue74b\u6993\u3c25\u3310\u6c56\u3b4c\ua202\u38f2\ub6e6\u75e8\u681e\u34a3\u8989\u4785\ubdad\ue596\u52d4\ua73d\u80a5\uc85b\ud454\ufd1e\u9ffd\uad1c\u3815\uf503\u8e9e\uf432\uaac5\uc3c4\ufe84\u0cc3\u70cf\u8658\u0a60\u1177\u8bbe\udaf5\u11a5\u1b56\ud1a2\ueb68\u394a\ua299\ue26d\ua9ad\ua6a2\uf39b\u9faf\uf7fb\ua457\u689b\u9c1a\u577b\u2a1e\u505f\udf75\uc7a0\ua64b\u1df8\u1b3a\u3560\u01bf\u0df4\ue02a\u1fc5\u9f65\u1c9d\u585e\uc622\u4bb2\u79c6\ubeba\u2966\ue888\u2d68\u3760\u81b9\u8746\u8e7a\ued1e\uf90e\ubd09\u0ae8\u2579\u5cdc\ua1b4\uf09a\u979c\u8dfc\u21a4\u8d8a\u53cd\ubb26\uc4db\u547f\uc06e\ufe2f\u9850\uedd2\u685a\u4661\ucb49\u11f1\u65d4\ub63e\uf25b\u87d0\ua96d\u3dff\u6ab0\u7589\u99aa\ud214\ud07b\ud4f1\u33a6\u734f\ude44\u5fe4\u7471\u1b69\ua98f\u7e2b");
 *         "b0d9c21e1639827a1bd5263d87c6c545b7f448bb7742e24d45dfa0e83e3add65"
 *
 * This function was written by Chris Drost of drostie.org, and he hereby dedicates it into the 
 * public domain: it has no copyright. It is provided with NO WARRANTIES OF ANY KIND. 
 * I do humbly request that you provide me some sort of credit if you use it; but I leave that 
 * choice up to you.
 */

/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, regexp: true, newcap: true, immed: true, strict: true */
"use strict";
var blake256 = (function () {
	var iv; var g; var r; var block; var constants; var sigma; var circ; var state; var message; var output; var two32;
	two32 = 4 * (1 << 30);
	iv = [
		0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
		0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
	];
	constants = [
		0x243F6A88, 0x85A308D3, 0x13198A2E, 0x03707344, 
		0xA4093822, 0x299F31D0, 0x082EFA98, 0xEC4E6C89, 
		0x452821E6, 0x38D01377, 0xBE5466CF, 0x34E90C6C, 
		0xC0AC29B7, 0xC97C50DD, 0x3F84D5B5, 0xB5470917
	];
	output = function (i) {
		if (i < 0) {
			i += two32;
		}
		return ("00000000" + i.toString(16)).slice(-8);
	};
	/* The spec calls for the sigma values at 2i and 2i + 1 to be passed into 
	 * the g function simultaneously. This implementation uses a byte array to
	 * perform this task.
	 */
	sigma = [
		[16, 50, 84, 118, 152, 186, 220, 254], [174, 132, 249, 109, 193, 32, 123, 53], 
		[139, 12, 37, 223, 234, 99, 23, 73], [151, 19, 205, 235, 98, 165, 4, 143], 
		[9, 117, 66, 250, 30, 203, 134, 211], [194, 166, 176, 56, 212, 87, 239, 145], 
		[92, 241, 222, 164, 112, 54, 41, 184], [189, 231, 28, 147, 5, 79, 104, 162], 
		[246, 158, 59, 128, 44, 125, 65, 90], [42, 72, 103, 81, 191, 233, 195, 13]
	];
	circ = function (a, b, n) {
		var s = state[a] ^ state[b];
		state[a] = (s >>> n) | (s << (32 - n));
	};
	g = function (i, a, b, c, d) {
		var u = block + sigma[r][i] % 16, v = block + (sigma[r][i] >> 4);
		a %= 4;
		b = 4 + b % 4;
		c = 8 + c % 4;
		d = 12 + d % 4;
		state[a] += state[b] + (message[u] ^ constants[v % 16]);
		circ(d, a, 16);
		state[c] += state[d];
		circ(b, c, 12);
		state[a] += state[b] + (message[v] ^ constants[u % 16]);
		circ(d, a, 8);
		state[c] += state[d];
		circ(b, c, 7);
	};
	return function (msg, salt) {
		if (! (salt instanceof Array && salt.length === 4)) {
			salt = [0, 0, 0, 0];
		}
		var pad; var chain; var len; var L; var last_L; var last; var total; var i; 
		chain = iv.slice(0);
		pad = constants.slice(0, 8);
		for (r = 0; r < 4; r += 1) {
			pad[r] ^= salt[r];
		}
		// pre-padding bit length of the string.
		len = msg.length * 16;
		last_L = (len % 512 > 446 || len % 512 === 0) ? 0 : len;
		// padding step: append a 1, then a bunch of 0's until we're at 447 bits,
		// then another 1 (note: 448/16 = 28), then len as a 64-bit integer.
		if (len % 512 === 432) {
			msg += "\u8001";
		} else {
			msg += "\u8000";
			while (msg.length % 32 !== 27) {
				msg += "\u0000";
			}
			msg += "\u0001";
		}
		message = [];
		for (i = 0; i < msg.length; i += 2) {
			message.push(msg.charCodeAt(i) * 65536 + msg.charCodeAt(i + 1));
		}
		message.push(0);
		message.push(len);
		last = message.length - 16;
		total = 0;
		for (block = 0; block < message.length; block += 16) {
			total += 512;
			L = (block === last) ? last_L : Math.min(len, total);
			state = chain.concat(pad);
			state[12] ^= L;
			state[13] ^= L;
			for (r = 0; r < 10; r += 1) {
				for (i = 0; i < 8; i += 1) {
					if (i < 4) {
						g(i, i, i, i, i);
					} else {
						g(i, i, i + 1, i + 2, i + 3);
					}
				}
			}
			for (i = 0; i < 8; i += 1) {
				chain[i] ^= salt[i % 4] ^ state[i] ^ state[i + 8];
			}
		}
		return chain.map(output).join("");
	};
}());