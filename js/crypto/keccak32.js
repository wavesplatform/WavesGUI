/* keccak32.js
 * Implements the final version of keccak[256, 544, 0] submitted to NIST,
 * truncated to 256 bits and acting on UTF-16LE strings.
 *
 * The following test vectors are given on the Keccak NIST CD:
 *     ShortMsgKAT_r256c544.txt
 *         Len = 0
 *         Msg = 00
 *         Squeezed = 2507DC4976767ADD735F22C1831FBF323CB9F94755C289A680B327ADFF881FCD5D9B3816314C55AB80881001B833C5BD02E8AC5359B07C27ACDFBB64ABE8738451AA7049
 *         ...
 *         Len = 16
 *         Msg = 41FB
 *         Squeezed = DCCDEF818CEEFE1CB20AF60AAFBF836D889462AC1A1BCEB756648B6B5CAE991B2C7C8976BA791CB69E8254ADAE50FD7A0F0AADB2546A45C55F7824EBD4A48998C09A69E7
 *         ...
 *         Len = 2000
 *         Msg = B3C5E74B69933C2533106C563B4CA20238F2B6E675E8681E34A389894785BDADE59652D4A73D80A5C85BD454FD1E9FFDAD1C3815F5038E9EF432AAC5C3C4FE840CC370CF86580A6011778BBEDAF511A51B56D1A2EB68394AA299E26DA9ADA6A2F39B9FAFF7FBA457689B9C1A577B2A1E505FDF75C7A0A64B1DF81B3A356001BF0DF4E02A1FC59F651C9D585EC6224BB279C6BEBA2966E8882D68376081B987468E7AED1EF90EBD090AE825795CDCA1B4F09A979C8DFC21A48D8A53CDBB26C4DB547FC06EFE2F9850EDD2685A4661CB4911F165D4B63EF25B87D0A96D3DFF6AB0758999AAD214D07BD4F133A6734FDE445FE474711B69A98F7E2B
 *         Squeezed = 558003DE96ACABA616A73027DFE205C8D011A90F9E12A0751E86DD1A3F11569520B1FAF0455343937697693B6095DE0646111B4865EB2587EABA56A25459045A29DC6AB3
 * 
 * Since this implementation is little-endian, the corresponding Javascript is:
 * 
 *     keccak32("");
 *         "2507dc4976767add735f22c1831fbf323cb9f94755c289a680b327adff881fcd"
 *     keccak32("\ufb41");
 *         "dccdef818ceefe1cb20af60aafbf836d889462ac1a1bceb756648b6b5cae991b"
 *     keccak32("\uC5B3\u4BE7\u9369\u253C\u1033\u566C\u4C3B\u02A2\uF238\uE6B6\uE875\u1E68\uA334\u8989\u8547\uADBD\u96E5\uD452\u3DA7\uA580\u5BC8\u54D4\u1EFD\uFD9F\u1CAD\u1538\u03F5\u9E8E\u32F4\uC5AA\uC4C3\u84FE\uC30C\uCF70\u5886\u600A\u7711\uBE8B\uF5DA\uA511\u561B\uA2D1\u68EB\u4A39\u99A2\u6DE2\uADA9\uA2A6\u9BF3\uAF9F\uFBF7\u57A4\u9B68\u1A9C\u7B57\u1E2A\u5F50\u75DF\uA0C7\u4BA6\uF81D\u3A1B\u6035\uBF01\uF40D\u2AE0\uC51F\u659F\u9D1C\u5E58\u22C6\uB24B\uC679\uBABE\u6629\u88E8\u682D\u6037\uB981\u4687\u7A8E\u1EED\u0EF9\u09BD\uE80A\u7925\uDC5C\uB4A1\u9AF0\u9C97\uFC8D\uA421\u8A8D\uCD53\u26BB\uDBC4\u7F54\u6EC0\u2FFE\u5098\uD2ED\u5A68\u6146\u49CB\uF111\uD465\u3EB6\u5BF2\uD087\u6DA9\uFF3D\uB06A\u8975\uAA99\u14D2\u7BD0\uF1D4\uA633\u4F73\u44DE\uE45F\u7174\u691B\u8FA9\u2B7E");
 *         "558003de96acaba616a73027dfe205c8d011a90f9e12a0751e86dd1a3f115695"
 * 
 * This function was written by Chris Drost of drostie.org, and he hereby dedicates it into the 
 * public domain: it has no copyright. It is provided with NO WARRANTIES OF ANY KIND. 
 * I do humbly request that you provide me some sort of credit if you use it; but I leave that 
 * choice up to you.
 */

/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, regexp: true, newcap: true, immed: true, strict: true */
"use strict";
var keccak32 = (function () {
	var permute, RC, r, circ, hex, output_fn;
	permute = [0, 10, 20, 5, 15, 16, 1, 11, 21, 6, 7, 17, 2, 12, 22, 23, 8, 18, 3, 13, 14, 24, 9, 19, 4];
	RC = "1,8082,808a,80008000,808b,80000001,80008081,8009,8a,88,80008009,8000000a,8000808b,8b,8089,8003,8002,80,800a,8000000a,80008081,8080"
		.split(",").map(function (i) { 
			return parseInt(i, 16); 
		});
	r = [0, 1, 30, 28, 27, 4, 12, 6, 23, 20, 3, 10, 11, 25, 7, 9, 13, 15, 21, 8, 18, 2, 29, 24, 14];
	circ = function (s, n) {
		return (s << n) | (s >>> (32 - n));
	};
	hex = function (n) {
		return ("00" + n.toString(16)).slice(-2);
	};
	output_fn = function (n) {
		return hex(n & 255) + hex(n >>> 8) + hex(n >>> 16) + hex(n >>> 24);
	};
	return function (m) {
		var i, b, k, x, y, C, D, round, next, state;
		state = [];
		for (i = 0; i < 25; i += 1) {
			state[i] = 0;
		}
		C = [];
		D = [];
		next = [];
		if (m.length % 16 === 15) {
			m+="\u8001";
		} else {
			m += "\x01";
			while (m.length % 16 !== 15) {
				m += "\0";
			}
			m+="\u8000";
		}
		for (b = 0; b < m.length; b += 16) {
			for (k = 0; k < 16; k += 2) {
				state[k / 2] ^= m.charCodeAt(b + k) + m.charCodeAt(b + k + 1) * 65536;
			}
			for (round = 0; round < 22; round += 1) {
				for (x = 0; x < 5; x += 1) {
					C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20]; 
				}
				for (x = 0; x < 5; x += 1) {
					D[x] = C[(x + 4) % 5] ^ circ(C[(x + 1) % 5], 1);
				}
				for (i = 0; i < 25; i += 1) {
					next[permute[i]] = circ(state[i] ^ D[i % 5], r[i]);
				}
				for (x = 0; x < 5; x += 1) {
					for (y = 0; y < 25; y += 5) {
						state[y + x] = next[y + x] ^ ((~ next[y + (x + 1) % 5]) & (next[y + (x + 2) % 5]));
					}
				}
				state[0] ^= RC[round];
			}
		}
		return state.slice(0, 8).map(output_fn).join("");
	};
}());