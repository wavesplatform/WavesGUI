(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var C_lib_WordArray = C_lib.WordArray;
    var C_lib_Hash = C_lib.Hash;
    var C_algo = C.algo;

    // Constants
    var K = [
        0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344,
        0xa4093822, 0x299f31d0, 0x082efa98, 0xec4e6c89,
        0x452821e6, 0x38d01377, 0xbe5466cf, 0x34e90c6c,
        0xc0ac29b7, 0xc97c50dd, 0x3f84d5b5, 0xb5470917
    ];

    // Permutations
    var P = [
        [0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15],
        [14, 10, 4,  8,  9,  15, 13, 6,  1,  12, 0,  2,  11, 7,  5,  3 ],
        [11, 8,  12, 0,  5,  2,  15, 13, 10, 14, 3,  6,  7,  1,  9,  4 ],
        [7,  9,  3,  1,  13, 12, 11, 14, 2,  6,  5,  10, 4,  0,  15, 8 ],
        [9,  0,  5,  7,  2,  4,  10, 15, 14, 1,  11, 12, 6,  8,  3,  13],
        [2,  12, 6,  10, 0,  11, 8,  3,  4,  13, 7,  5,  15, 14, 1,  9 ],
        [12, 5,  1,  15, 14, 13, 4,  10, 0,  7,  6,  3,  9,  2,  8,  11],
        [13, 11, 7,  14, 12, 1,  3,  9,  5,  0,  15, 4,  8,  6,  2,  10],
        [6,  15, 14, 9,  11, 3,  0,  8,  12, 2,  13, 7,  1,  4,  10, 5 ],
        [10, 2,  8,  4,  7,  6,  1,  5,  15, 11, 9, 14,  3,  12, 13, 0 ]
    ];

    /**
     * BLAKE-256 hash algorithm.
     */
    var C_algo_BLAKE256 = C_algo.BLAKE256 = C_lib_Hash.extend({
        _cfg: C_lib_Hash._cfg.extend({
            salt: C_lib_WordArray.create([0, 0, 0, 0])
        }),

        _doReset: function () {
            // Shortcut
            var H = this._hash.words;

            // Initial values
            H[0] = 0x6a09e667;
            H[1] = 0xbb67ae85;
            H[2] = 0x3c6ef372;
            H[3] = 0xa54ff53a;
            H[4] = 0x510e527f;
            H[5] = 0x9b05688c;
            H[6] = 0x1f83d9ab;
            H[7] = 0x5be0cd19;

            // Counter
            this._t = 0;
        },

        _doHashBlock: function (offset) {
            // Shortcuts
            var message = this._message;
            var M = message.words;
            var H = this._hash.words;
            var S = this._cfg.salt.words;

            // Counter
            var t = this._t += 512;

            // State
            var v = [
                H[0], H[1], H[2], H[3],
                H[4], H[5], H[6], H[7],
                0x243f6a88 ^ S[0], 0x85a308d3 ^ S[1],
                0x13198a2e ^ S[2], 0x03707344 ^ S[3],
                0xa4093822 ^ t,    0x299f31d0 ^ t,
                0x082efa98,        0xec4e6c89
            ];

            // Rounds
            for (var r = 0; r < 14; r++) {
                var rMod10 = r % 10;

                G(M, offset, v, rMod10, 0, 4, 8,  12, 0 );
                G(M, offset, v, rMod10, 1, 5, 9,  13, 2 );
                G(M, offset, v, rMod10, 2, 6, 10, 14, 4 );
                G(M, offset, v, rMod10, 3, 7, 11, 15, 6 );
                G(M, offset, v, rMod10, 0, 5, 10, 15, 8 );
                G(M, offset, v, rMod10, 1, 6, 11, 12, 10);
                G(M, offset, v, rMod10, 2, 7, 8,  13, 12);
                G(M, offset, v, rMod10, 3, 4, 9,  14, 14);
            }

            // Finalization
            for (var i = 0; i < 8; i++) {
                H[i] ^= S[i % 4] ^ v[i] ^ v[i + 8];
            }
        },

        _doCompute: function () {
            // Shortcuts
            var message = this._message;
            var M = message.words;

            var nBitsTotal = this._length * 8;
            var nBitsLeft = message.sigBytes * 8;

            // Adjust counter
            if (nBitsLeft) {
                this._t -= 512 - nBitsLeft;
            } else {
                this._t = -512;
            }

            // Add padding
            M[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
            M[(((nBitsLeft + 64) >>> 9) << 4) + 13] |= 1;
            M[M.length + 1] = nBitsTotal;
            message.sigBytes = M.length * 4;

            // Hash final blocks
            this._hashBlocks();
        }
    });

    function G(M, offset, v, r, a, b, c, d, e) {
        // Shortcuts
        var P_r_e = P[r][e];
        var P_r_e_1 = P[r][e + 1];

        // Transformation
        v[a] = (v[a] + v[b] + (M[offset + P_r_e] ^ K[P_r_e_1])) | 0;

        var n = v[d] ^ v[a];
        v[d] = (n << 16) | (n >>> 16);

        v[c] = (v[c] + v[d]) | 0;

        var n = v[b] ^ v[c];
        v[b] = (n << 20) | (n >>> 12);

        v[a] = (v[a] + v[b] + (M[offset + P_r_e_1] ^ K[P_r_e])) | 0;

        var n = v[d] ^ v[a];
        v[d] = (n << 24) | (n >>> 8);

        v[c] = (v[c] + v[d]) | 0;

        var n = v[b] ^ v[c];
        v[b] = (n << 25) | (n >>> 7);
    }

    // Helpers
    C.BLAKE256 = C_lib_Hash._createHelper(C_algo_BLAKE256);
    C.HMAC_BLAKE256 = C_lib_Hash._createHmacHelper(C_algo_BLAKE256);
}());
