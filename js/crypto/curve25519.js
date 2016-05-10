/* Ported to JavaScript from Java 07/01/14.
 *
 * Ported from C to Java by Dmitry Skiba [sahn0], 23/02/08.
 * Original: http://cds.xs4all.nl:8081/ecdh/
 */
/* Generic 64-bit integer implementation of Curve25519 ECDH
 * Written by Matthijs van Duin, 200608242056
 * Public domain.
 *
 * Based on work by Daniel J Bernstein, http://cr.yp.to/ecdh.html
 */

var curve25519 = function () {

    //region Constants

    var KEY_SIZE = 32;

    /* array length */
    var UNPACKED_SIZE = 16;

    /* group order (a prime near 2^252+2^124) */
    var ORDER = [
        237, 211, 245, 92,
        26, 99, 18, 88,
        214, 156, 247, 162,
        222, 249, 222, 20,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 16
    ];

    /* smallest multiple of the order that's >= 2^255 */
    var ORDER_TIMES_8 = [
        104, 159, 174, 231,
        210, 24, 147, 192,
        178, 230, 188, 23,
        245, 206, 247, 166,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 128
    ];

    /* constants 2Gy and 1/(2Gy) */
    var BASE_2Y = [
        22587, 610, 29883, 44076,
        15515, 9479, 25859, 56197,
        23910, 4462, 17831, 16322,
        62102, 36542, 52412, 16035
    ];

    var BASE_R2Y = [
        5744, 16384, 61977, 54121,
        8776, 18501, 26522, 34893,
        23833, 5823, 55924, 58749,
        24147, 14085, 13606, 6080
    ];

    var C1 = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var C9 = [9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var C486671 = [0x6D0F, 0x0007, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var C39420360 = [0x81C8, 0x0259, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    var P25 = 33554431; /* (1 << 25) - 1 */
    var P26 = 67108863; /* (1 << 26) - 1 */

    //#endregion

    //region Key Agreement

    /* Private key clamping
     *   k [out] your private key for key agreement
     *   k  [in]  32 random bytes
     */
    function clamp (k) {
        k[31] &= 0x7F;
        k[31] |= 0x40;
        k[ 0] &= 0xF8;
    }

    //endregion

    //region radix 2^8 math

    function cpy32 (d, s) {
        for (var i = 0; i < 32; i++)
            d[i] = s[i];
    }

    /* p[m..n+m-1] = q[m..n+m-1] + z * x */
    /* n is the size of x */
    /* n+m is the size of p and q */
    function mula_small (p, q, m, x, n, z) {
        m = m | 0;
        n = n | 0;
        z = z | 0;

        var v = 0;
        for (var i = 0; i < n; ++i) {
            v += (q[i + m] & 0xFF) + z * (x[i] & 0xFF);
            p[i + m] = (v & 0xFF);
            v >>= 8;
        }

        return v;
    }

    /* p += x * y * z  where z is a small integer
     * x is size 32, y is size t, p is size 32+t
     * y is allowed to overlap with p+32 if you don't care about the upper half  */
    function mula32 (p, x, y, t, z) {
        t = t | 0;
        z = z | 0;

        var n = 31;
        var w = 0;
        var i = 0;
        for (; i < t; i++) {
            var zy = z * (y[i] & 0xFF);
            w += mula_small(p, p, i, x, n, zy) + (p[i+n] & 0xFF) + zy * (x[n] & 0xFF);
            p[i + n] = w & 0xFF;
            w >>= 8;
        }
        p[i + n] = (w + (p[i + n] & 0xFF)) & 0xFF;
        return w >> 8;
    }

    /* divide r (size n) by d (size t), returning quotient q and remainder r
     * quotient is size n-t+1, remainder is size t
     * requires t > 0 && d[t-1] !== 0
     * requires that r[-1] and d[-1] are valid memory locations
     * q may overlap with r+t */
    function divmod (q, r, n, d, t) {
        n = n | 0;
        t = t | 0;

        var rn = 0;
        var dt = (d[t - 1] & 0xFF) << 8;
        if (t > 1)
            dt |= (d[t - 2] & 0xFF);

        while (n-- >= t) {
            var z = (rn << 16) | ((r[n] & 0xFF) << 8);
            if (n > 0)
                z |= (r[n - 1] & 0xFF);

            var i = n - t + 1;
            z /= dt;
            rn += mula_small(r, r, i, d, t, -z);
            q[i] = (z + rn) & 0xFF;
            /* rn is 0 or -1 (underflow) */
            mula_small(r, r, i, d, t, -rn);
            rn = r[n] & 0xFF;
            r[n] = 0;
        }

        r[t-1] = rn & 0xFF;
    }

    function numsize (x, n) {
        while (n-- !== 0 && x[n] === 0) { }
        return n + 1;
    }

    /* Returns x if a contains the gcd, y if b.
     * Also, the returned buffer contains the inverse of a mod b,
     * as 32-byte signed.
     * x and y must have 64 bytes space for temporary use.
     * requires that a[-1] and b[-1] are valid memory locations  */
    function egcd32 (x, y, a, b) {
        var an, bn = 32, qn, i;
        for (i = 0; i < 32; i++)
            x[i] = y[i] = 0;
        x[0] = 1;
        an = numsize(a, 32);
        if (an === 0)
            return y; /* division by zero */
        var temp = new Array(32);
        while (true) {
            qn = bn - an + 1;
            divmod(temp, b, bn, a, an);
            bn = numsize(b, bn);
            if (bn === 0)
                return x;
            mula32(y, x, temp, qn, -1);

            qn = an - bn + 1;
            divmod(temp, a, an, b, bn);
            an = numsize(a, an);
            if (an === 0)
                return y;
            mula32(x, y, temp, qn, -1);
        }
    }

    //endregion

    //region radix 2^25.5 GF(2^255-19) math

    //region pack / unpack

    /* Convert to internal format from little-endian byte format */
    function unpack (x, m) {
        for (var i = 0; i < KEY_SIZE; i += 2)
            x[i / 2] = m[i] & 0xFF | ((m[i + 1] & 0xFF) << 8);
    }

    /* Check if reduced-form input >= 2^255-19 */
    function is_overflow (x) {
        return (
            ((x[0] > P26 - 19)) &&
                ((x[1] & x[3] & x[5] & x[7] & x[9]) === P25) &&
                ((x[2] & x[4] & x[6] & x[8]) === P26)
            ) || (x[9] > P25);
    }

    /* Convert from internal format to little-endian byte format.  The
     * number must be in a reduced form which is output by the following ops:
     *     unpack, mul, sqr
     *     set --  if input in range 0 .. P25
     * If you're unsure if the number is reduced, first multiply it by 1.  */
    function pack (x, m) {
        for (var i = 0; i < UNPACKED_SIZE; ++i) {
            m[2 * i] = x[i] & 0x00FF;
            m[2 * i + 1] = (x[i] & 0xFF00) >> 8;
        }
    }

    //endregion

    function createUnpackedArray () {
        return new Uint16Array(UNPACKED_SIZE);
    }

    /* Copy a number */
    function cpy (d, s) {
        for (var i = 0; i < UNPACKED_SIZE; ++i)
            d[i] = s[i];
    }

    /* Set a number to value, which must be in range -185861411 .. 185861411 */
    function set (d, s) {
        d[0] = s;
        for (var i = 1; i < UNPACKED_SIZE; ++i)
            d[i] = 0;
    }

    /* Add/subtract two numbers.  The inputs must be in reduced form, and the
     * output isn't, so to do another addition or subtraction on the output,
     * first multiply it by one to reduce it. */
    var add = c255laddmodp;
    var sub = c255lsubmodp;

    /* Multiply a number by a small integer in range -185861411 .. 185861411.
     * The output is in reduced form, the input x need not be.  x and xy may point
     * to the same buffer. */
    var mul_small = c255lmulasmall;

    /* Multiply two numbers.  The output is in reduced form, the inputs need not be. */
    var mul = c255lmulmodp;

    /* Square a number.  Optimization of  mul25519(x2, x, x)  */
    var sqr = c255lsqrmodp;

    /* Calculates a reciprocal.  The output is in reduced form, the inputs need not
     * be.  Simply calculates  y = x^(p-2)  so it's not too fast. */
    /* When sqrtassist is true, it instead calculates y = x^((p-5)/8) */
    function recip (y, x, sqrtassist) {
        var t0 = createUnpackedArray();
        var t1 = createUnpackedArray();
        var t2 = createUnpackedArray();
        var t3 = createUnpackedArray();
        var t4 = createUnpackedArray();

        /* the chain for x^(2^255-21) is straight from djb's implementation */
        var i;
        sqr(t1, x); /*  2 === 2 * 1	*/
        sqr(t2, t1); /*  4 === 2 * 2	*/
        sqr(t0, t2); /*  8 === 2 * 4	*/
        mul(t2, t0, x); /*  9 === 8 + 1	*/
        mul(t0, t2, t1); /* 11 === 9 + 2	*/
        sqr(t1, t0); /* 22 === 2 * 11	*/
        mul(t3, t1, t2); /* 31 === 22 + 9 === 2^5   - 2^0	*/
        sqr(t1, t3); /* 2^6   - 2^1	*/
        sqr(t2, t1); /* 2^7   - 2^2	*/
        sqr(t1, t2); /* 2^8   - 2^3	*/
        sqr(t2, t1); /* 2^9   - 2^4	*/
        sqr(t1, t2); /* 2^10  - 2^5	*/
        mul(t2, t1, t3); /* 2^10  - 2^0	*/
        sqr(t1, t2); /* 2^11  - 2^1	*/
        sqr(t3, t1); /* 2^12  - 2^2	*/
        for (i = 1; i < 5; i++) {
            sqr(t1, t3);
            sqr(t3, t1);
        } /* t3 */ /* 2^20  - 2^10	*/
        mul(t1, t3, t2); /* 2^20  - 2^0	*/
        sqr(t3, t1); /* 2^21  - 2^1	*/
        sqr(t4, t3); /* 2^22  - 2^2	*/
        for (i = 1; i < 10; i++) {
            sqr(t3, t4);
            sqr(t4, t3);
        } /* t4 */ /* 2^40  - 2^20	*/
        mul(t3, t4, t1); /* 2^40  - 2^0	*/
        for (i = 0; i < 5; i++) {
            sqr(t1, t3);
            sqr(t3, t1);
        } /* t3 */ /* 2^50  - 2^10	*/
        mul(t1, t3, t2); /* 2^50  - 2^0	*/
        sqr(t2, t1); /* 2^51  - 2^1	*/
        sqr(t3, t2); /* 2^52  - 2^2	*/
        for (i = 1; i < 25; i++) {
            sqr(t2, t3);
            sqr(t3, t2);
        } /* t3 */ /* 2^100 - 2^50 */
        mul(t2, t3, t1); /* 2^100 - 2^0	*/
        sqr(t3, t2); /* 2^101 - 2^1	*/
        sqr(t4, t3); /* 2^102 - 2^2	*/
        for (i = 1; i < 50; i++) {
            sqr(t3, t4);
            sqr(t4, t3);
        } /* t4 */ /* 2^200 - 2^100 */
        mul(t3, t4, t2); /* 2^200 - 2^0	*/
        for (i = 0; i < 25; i++) {
            sqr(t4, t3);
            sqr(t3, t4);
        } /* t3 */ /* 2^250 - 2^50	*/
        mul(t2, t3, t1); /* 2^250 - 2^0	*/
        sqr(t1, t2); /* 2^251 - 2^1	*/
        sqr(t2, t1); /* 2^252 - 2^2	*/
        if (sqrtassist !== 0) {
            mul(y, x, t2); /* 2^252 - 3 */
        } else {
            sqr(t1, t2); /* 2^253 - 2^3	*/
            sqr(t2, t1); /* 2^254 - 2^4	*/
            sqr(t1, t2); /* 2^255 - 2^5	*/
            mul(y, t1, t0); /* 2^255 - 21	*/
        }
    }

    /* checks if x is "negative", requires reduced input */
    function is_negative (x) {
        var isOverflowOrNegative = is_overflow(x) || x[9] < 0;
        var leastSignificantBit = x[0] & 1;
        return ((isOverflowOrNegative ? 1 : 0) ^ leastSignificantBit) & 0xFFFFFFFF;
    }

    /* a square root */
    function sqrt (x, u) {
        var v = createUnpackedArray();
        var t1 = createUnpackedArray();
        var t2 = createUnpackedArray();

        add(t1, u, u); /* t1 = 2u		*/
        recip(v, t1, 1); /* v = (2u)^((p-5)/8)	*/
        sqr(x, v); /* x = v^2		*/
        mul(t2, t1, x); /* t2 = 2uv^2		*/
        sub(t2, t2, C1); /* t2 = 2uv^2-1		*/
        mul(t1, v, t2); /* t1 = v(2uv^2-1)	*/
        mul(x, u, t1); /* x = uv(2uv^2-1)	*/
    }

    //endregion

    //region JavaScript Fast Math

    function c255lsqr8h (a7, a6, a5, a4, a3, a2, a1, a0) {
        var r = [];
        var v;
        r[0] = (v = a0*a0) & 0xFFFF;
        r[1] = (v = ((v / 0x10000) | 0) + 2*a0*a1) & 0xFFFF;
        r[2] = (v = ((v / 0x10000) | 0) + 2*a0*a2 + a1*a1) & 0xFFFF;
        r[3] = (v = ((v / 0x10000) | 0) + 2*a0*a3 + 2*a1*a2) & 0xFFFF;
        r[4] = (v = ((v / 0x10000) | 0) + 2*a0*a4 + 2*a1*a3 + a2*a2) & 0xFFFF;
        r[5] = (v = ((v / 0x10000) | 0) + 2*a0*a5 + 2*a1*a4 + 2*a2*a3) & 0xFFFF;
        r[6] = (v = ((v / 0x10000) | 0) + 2*a0*a6 + 2*a1*a5 + 2*a2*a4 + a3*a3) & 0xFFFF;
        r[7] = (v = ((v / 0x10000) | 0) + 2*a0*a7 + 2*a1*a6 + 2*a2*a5 + 2*a3*a4) & 0xFFFF;
        r[8] = (v = ((v / 0x10000) | 0) + 2*a1*a7 + 2*a2*a6 + 2*a3*a5 + a4*a4) & 0xFFFF;
        r[9] = (v = ((v / 0x10000) | 0) + 2*a2*a7 + 2*a3*a6 + 2*a4*a5) & 0xFFFF;
        r[10] = (v = ((v / 0x10000) | 0) + 2*a3*a7 + 2*a4*a6 + a5*a5) & 0xFFFF;
        r[11] = (v = ((v / 0x10000) | 0) + 2*a4*a7 + 2*a5*a6) & 0xFFFF;
        r[12] = (v = ((v / 0x10000) | 0) + 2*a5*a7 + a6*a6) & 0xFFFF;
        r[13] = (v = ((v / 0x10000) | 0) + 2*a6*a7) & 0xFFFF;
        r[14] = (v = ((v / 0x10000) | 0) + a7*a7) & 0xFFFF;
        r[15] = ((v / 0x10000) | 0);
        return r;
    }

    function c255lsqrmodp (r, a) {
        var x = c255lsqr8h(a[15], a[14], a[13], a[12], a[11], a[10], a[9], a[8]);
        var z = c255lsqr8h(a[7], a[6], a[5], a[4], a[3], a[2], a[1], a[0]);
        var y = c255lsqr8h(a[15] + a[7], a[14] + a[6], a[13] + a[5], a[12] + a[4], a[11] + a[3], a[10] + a[2], a[9] + a[1], a[8] + a[0]);

        var v;
        r[0] = (v = 0x800000 + z[0] + (y[8] -x[8] -z[8] + x[0] -0x80) * 38) & 0xFFFF;
        r[1] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[1] + (y[9] -x[9] -z[9] + x[1]) * 38) & 0xFFFF;
        r[2] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[2] + (y[10] -x[10] -z[10] + x[2]) * 38) & 0xFFFF;
        r[3] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[3] + (y[11] -x[11] -z[11] + x[3]) * 38) & 0xFFFF;
        r[4] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[4] + (y[12] -x[12] -z[12] + x[4]) * 38) & 0xFFFF;
        r[5] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[5] + (y[13] -x[13] -z[13] + x[5]) * 38) & 0xFFFF;
        r[6] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[6] + (y[14] -x[14] -z[14] + x[6]) * 38) & 0xFFFF;
        r[7] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[7] + (y[15] -x[15] -z[15] + x[7]) * 38) & 0xFFFF;
        r[8] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[8] + y[0] -x[0] -z[0] + x[8] * 38) & 0xFFFF;
        r[9] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[9] + y[1] -x[1] -z[1] + x[9] * 38) & 0xFFFF;
        r[10] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[10] + y[2] -x[2] -z[2] + x[10] * 38) & 0xFFFF;
        r[11] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[11] + y[3] -x[3] -z[3] + x[11] * 38) & 0xFFFF;
        r[12] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[12] + y[4] -x[4] -z[4] + x[12] * 38) & 0xFFFF;
        r[13] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[13] + y[5] -x[5] -z[5] + x[13] * 38) & 0xFFFF;
        r[14] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[14] + y[6] -x[6] -z[6] + x[14] * 38) & 0xFFFF;
        var r15 = 0x7fff80 + ((v / 0x10000) | 0) + z[15] + y[7] -x[7] -z[7] + x[15] * 38;
        c255lreduce(r, r15);
    }

    function c255lmul8h (a7, a6, a5, a4, a3, a2, a1, a0, b7, b6, b5, b4, b3, b2, b1, b0) {
        var r = [];
        var v;
        r[0] = (v = a0*b0) & 0xFFFF;
        r[1] = (v = ((v / 0x10000) | 0) + a0*b1 + a1*b0) & 0xFFFF;
        r[2] = (v = ((v / 0x10000) | 0) + a0*b2 + a1*b1 + a2*b0) & 0xFFFF;
        r[3] = (v = ((v / 0x10000) | 0) + a0*b3 + a1*b2 + a2*b1 + a3*b0) & 0xFFFF;
        r[4] = (v = ((v / 0x10000) | 0) + a0*b4 + a1*b3 + a2*b2 + a3*b1 + a4*b0) & 0xFFFF;
        r[5] = (v = ((v / 0x10000) | 0) + a0*b5 + a1*b4 + a2*b3 + a3*b2 + a4*b1 + a5*b0) & 0xFFFF;
        r[6] = (v = ((v / 0x10000) | 0) + a0*b6 + a1*b5 + a2*b4 + a3*b3 + a4*b2 + a5*b1 + a6*b0) & 0xFFFF;
        r[7] = (v = ((v / 0x10000) | 0) + a0*b7 + a1*b6 + a2*b5 + a3*b4 + a4*b3 + a5*b2 + a6*b1 + a7*b0) & 0xFFFF;
        r[8] = (v = ((v / 0x10000) | 0) + a1*b7 + a2*b6 + a3*b5 + a4*b4 + a5*b3 + a6*b2 + a7*b1) & 0xFFFF;
        r[9] = (v = ((v / 0x10000) | 0) + a2*b7 + a3*b6 + a4*b5 + a5*b4 + a6*b3 + a7*b2) & 0xFFFF;
        r[10] = (v = ((v / 0x10000) | 0) + a3*b7 + a4*b6 + a5*b5 + a6*b4 + a7*b3) & 0xFFFF;
        r[11] = (v = ((v / 0x10000) | 0) + a4*b7 + a5*b6 + a6*b5 + a7*b4) & 0xFFFF;
        r[12] = (v = ((v / 0x10000) | 0) + a5*b7 + a6*b6 + a7*b5) & 0xFFFF;
        r[13] = (v = ((v / 0x10000) | 0) + a6*b7 + a7*b6) & 0xFFFF;
        r[14] = (v = ((v / 0x10000) | 0) + a7*b7) & 0xFFFF;
        r[15] = ((v / 0x10000) | 0);
        return r;
    }

    function c255lmulmodp (r, a, b) {
        // Karatsuba multiplication scheme: x*y = (b^2+b)*x1*y1 - b*(x1-x0)*(y1-y0) + (b+1)*x0*y0
        var x = c255lmul8h(a[15], a[14], a[13], a[12], a[11], a[10], a[9], a[8], b[15], b[14], b[13], b[12], b[11], b[10], b[9], b[8]);
        var z = c255lmul8h(a[7], a[6], a[5], a[4], a[3], a[2], a[1], a[0], b[7], b[6], b[5], b[4], b[3], b[2], b[1], b[0]);
        var y = c255lmul8h(a[15] + a[7], a[14] + a[6], a[13] + a[5], a[12] + a[4], a[11] + a[3], a[10] + a[2], a[9] + a[1], a[8] + a[0],
            b[15] + b[7], b[14] + b[6], b[13] + b[5], b[12] + b[4], b[11] + b[3], b[10] + b[2], b[9] + b[1], b[8] + b[0]);

        var v;
        r[0] = (v = 0x800000 + z[0] + (y[8] -x[8] -z[8] + x[0] -0x80) * 38) & 0xFFFF;
        r[1] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[1] + (y[9] -x[9] -z[9] + x[1]) * 38) & 0xFFFF;
        r[2] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[2] + (y[10] -x[10] -z[10] + x[2]) * 38) & 0xFFFF;
        r[3] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[3] + (y[11] -x[11] -z[11] + x[3]) * 38) & 0xFFFF;
        r[4] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[4] + (y[12] -x[12] -z[12] + x[4]) * 38) & 0xFFFF;
        r[5] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[5] + (y[13] -x[13] -z[13] + x[5]) * 38) & 0xFFFF;
        r[6] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[6] + (y[14] -x[14] -z[14] + x[6]) * 38) & 0xFFFF;
        r[7] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[7] + (y[15] -x[15] -z[15] + x[7]) * 38) & 0xFFFF;
        r[8] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[8] + y[0] -x[0] -z[0] + x[8] * 38) & 0xFFFF;
        r[9] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[9] + y[1] -x[1] -z[1] + x[9] * 38) & 0xFFFF;
        r[10] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[10] + y[2] -x[2] -z[2] + x[10] * 38) & 0xFFFF;
        r[11] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[11] + y[3] -x[3] -z[3] + x[11] * 38) & 0xFFFF;
        r[12] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[12] + y[4] -x[4] -z[4] + x[12] * 38) & 0xFFFF;
        r[13] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[13] + y[5] -x[5] -z[5] + x[13] * 38) & 0xFFFF;
        r[14] = (v = 0x7fff80 + ((v / 0x10000) | 0) + z[14] + y[6] -x[6] -z[6] + x[14] * 38) & 0xFFFF;
        var r15 = 0x7fff80 + ((v / 0x10000) | 0) + z[15] + y[7] -x[7] -z[7] + x[15] * 38;
        c255lreduce(r, r15);
    }

    function c255lreduce (a, a15) {
        var v = a15;
        a[15] = v & 0x7FFF;
        v = ((v / 0x8000) | 0) * 19;
        for (var i = 0; i <= 14; ++i) {
            a[i] = (v += a[i]) & 0xFFFF;
            v = ((v / 0x10000) | 0);
        }

        a[15] += v;
    }

    function c255laddmodp (r, a, b) {
        var v;
        r[0] = (v = (((a[15] / 0x8000) | 0) + ((b[15] / 0x8000) | 0)) * 19 + a[0] + b[0]) & 0xFFFF;
        for (var i = 1; i <= 14; ++i)
            r[i] = (v = ((v / 0x10000) | 0) + a[i] + b[i]) & 0xFFFF;

        r[15] = ((v / 0x10000) | 0) + (a[15] & 0x7FFF) + (b[15] & 0x7FFF);
    }

    function c255lsubmodp (r, a, b) {
        var v;
        r[0] = (v = 0x80000 + (((a[15] / 0x8000) | 0) - ((b[15] / 0x8000) | 0) - 1) * 19 + a[0] - b[0]) & 0xFFFF;
        for (var i = 1; i <= 14; ++i)
            r[i] = (v = ((v / 0x10000) | 0) + 0x7fff8 + a[i] - b[i]) & 0xFFFF;

        r[15] = ((v / 0x10000) | 0) + 0x7ff8 + (a[15] & 0x7FFF) - (b[15] & 0x7FFF);
    }

    function c255lmulasmall (r, a, m) {
        var v;
        r[0] = (v = a[0] * m) & 0xFFFF;
        for (var i = 1; i <= 14; ++i)
            r[i] = (v = ((v / 0x10000) | 0) + a[i]*m) & 0xFFFF;

        var r15 = ((v / 0x10000) | 0) + a[15]*m;
        c255lreduce(r, r15);
    }

    //endregion

    /********************* Elliptic curve *********************/

    /* y^2 = x^3 + 486662 x^2 + x  over GF(2^255-19) */

    /* t1 = ax + az
     * t2 = ax - az  */
    function mont_prep (t1, t2, ax, az) {
        add(t1, ax, az);
        sub(t2, ax, az);
    }

    /* A = P + Q   where
     *  X(A) = ax/az
     *  X(P) = (t1+t2)/(t1-t2)
     *  X(Q) = (t3+t4)/(t3-t4)
     *  X(P-Q) = dx
     * clobbers t1 and t2, preserves t3 and t4  */
    function mont_add (t1, t2, t3, t4, ax, az, dx) {
        mul(ax, t2, t3);
        mul(az, t1, t4);
        add(t1, ax, az);
        sub(t2, ax, az);
        sqr(ax, t1);
        sqr(t1, t2);
        mul(az, t1, dx);
    }

    /* B = 2 * Q   where
     *  X(B) = bx/bz
     *  X(Q) = (t3+t4)/(t3-t4)
     * clobbers t1 and t2, preserves t3 and t4  */
    function mont_dbl (t1, t2, t3, t4, bx, bz) {
        sqr(t1, t3);
        sqr(t2, t4);
        mul(bx, t1, t2);
        sub(t2, t1, t2);
        mul_small(bz, t2, 121665);
        add(t1, t1, bz);
        mul(bz, t1, t2);
    }

    /* Y^2 = X^3 + 486662 X^2 + X
     * t is a temporary  */
    function x_to_y2 (t, y2, x) {
        sqr(t, x);
        mul_small(y2, x, 486662);
        add(t, t, y2);
        add(t, t, C1);
        mul(y2, t, x);
    }

    /* P = kG   and  s = sign(P)/k  */
    function core (Px, s, k, Gx) {
        var dx = createUnpackedArray();
        var t1 = createUnpackedArray();
        var t2 = createUnpackedArray();
        var t3 = createUnpackedArray();
        var t4 = createUnpackedArray();
        var x = [createUnpackedArray(), createUnpackedArray()];
        var z = [createUnpackedArray(), createUnpackedArray()];
        var i, j;

        /* unpack the base */
        if (Gx !== null)
            unpack(dx, Gx);
        else
            set(dx, 9);

        /* 0G = point-at-infinity */
        set(x[0], 1);
        set(z[0], 0);

        /* 1G = G */
        cpy(x[1], dx);
        set(z[1], 1);

        for (i = 32; i-- !== 0;) {
            for (j = 8; j-- !== 0;) {
                /* swap arguments depending on bit */
                var bit1 = (k[i] & 0xFF) >> j & 1;
                var bit0 = ~(k[i] & 0xFF) >> j & 1;
                var ax = x[bit0];
                var az = z[bit0];
                var bx = x[bit1];
                var bz = z[bit1];

                /* a' = a + b	*/
                /* b' = 2 b	*/
                mont_prep(t1, t2, ax, az);
                mont_prep(t3, t4, bx, bz);
                mont_add(t1, t2, t3, t4, ax, az, dx);
                mont_dbl(t1, t2, t3, t4, bx, bz);
            }
        }

        recip(t1, z[0], 0);
        mul(dx, x[0], t1);

        pack(dx, Px);

        /* calculate s such that s abs(P) = G  .. assumes G is std base point */
        if (s !== null) {
            x_to_y2(t2, t1, dx); /* t1 = Py^2  */
            recip(t3, z[1], 0); /* where Q=P+G ... */
            mul(t2, x[1], t3); /* t2 = Qx  */
            add(t2, t2, dx); /* t2 = Qx + Px  */
            add(t2, t2, C486671); /* t2 = Qx + Px + Gx + 486662  */
            sub(dx, dx, C9); /* dx = Px - Gx  */
            sqr(t3, dx); /* t3 = (Px - Gx)^2  */
            mul(dx, t2, t3); /* dx = t2 (Px - Gx)^2  */
            sub(dx, dx, t1); /* dx = t2 (Px - Gx)^2 - Py^2  */
            sub(dx, dx, C39420360); /* dx = t2 (Px - Gx)^2 - Py^2 - Gy^2  */
            mul(t1, dx, BASE_R2Y); /* t1 = -Py  */

            if (is_negative(t1) !== 0)    /* sign is 1, so just copy  */
                cpy32(s, k);
            else            /* sign is -1, so negate  */
                mula_small(s, ORDER_TIMES_8, 0, k, 32, -1);

            /* reduce s mod q
             * (is this needed?  do it just in case, it's fast anyway) */
            //divmod((dstptr) t1, s, 32, order25519, 32);

            /* take reciprocal of s mod q */
            var temp1 = new Array(32);
            var temp2 = new Array(64);
            var temp3 = new Array(64);
            cpy32(temp1, ORDER);
            cpy32(s, egcd32(temp2, temp3, s, temp1));
            if ((s[31] & 0x80) !== 0)
                mula_small(s, s, 0, ORDER, 32, 1);

        }
    }

    /********* DIGITAL SIGNATURES *********/

    /* deterministic EC-KCDSA
     *
     *    s is the private key for signing
     *    P is the corresponding public key
     *    Z is the context data (signer public key or certificate, etc)
     *
     * signing:
     *
     *    m = hash(Z, message)
     *    x = hash(m, s)
     *    keygen25519(Y, NULL, x);
     *    r = hash(Y);
     *    h = m XOR r
     *    sign25519(v, h, x, s);
     *
     *    output (v,r) as the signature
     *
     * verification:
     *
     *    m = hash(Z, message);
     *    h = m XOR r
     *    verify25519(Y, v, h, P)
     *
     *    confirm  r === hash(Y)
     *
     * It would seem to me that it would be simpler to have the signer directly do
     * h = hash(m, Y) and send that to the recipient instead of r, who can verify
     * the signature by checking h === hash(m, Y).  If there are any problems with
     * such a scheme, please let me know.
     *
     * Also, EC-KCDSA (like most DS algorithms) picks x random, which is a waste of
     * perfectly good entropy, but does allow Y to be calculated in advance of (or
     * parallel to) hashing the message.
     */

    /* Signature generation primitive, calculates (x-h)s mod q
     *   h  [in]  signature hash (of message, signature pub key, and context data)
     *   x  [in]  signature private key
     *   s  [in]  private key for signing
     * returns signature value on success, undefined on failure (use different x or h)
     */

    function sign (h, x, s) {
        // v = (x - h) s  mod q
        var w, i;
        var h1 = new Array(32)
        var x1 = new Array(32);
        var tmp1 = new Array(64);
        var tmp2 = new Array(64);

        // Don't clobber the arguments, be nice!
        cpy32(h1, h);
        cpy32(x1, x);

        // Reduce modulo group order
        var tmp3 = new Array(32);
        divmod(tmp3, h1, 32, ORDER, 32);
        divmod(tmp3, x1, 32, ORDER, 32);

        // v = x1 - h1
        // If v is negative, add the group order to it to become positive.
        // If v was already positive we don't have to worry about overflow
        // when adding the order because v < ORDER and 2*ORDER < 2^256
        var v = new Array(32);
        mula_small(v, x1, 0, h1, 32, -1);
        mula_small(v, v , 0, ORDER, 32, 1);

        // tmp1 = (x-h)*s mod q
        mula32(tmp1, v, s, 32, 1);
        divmod(tmp2, tmp1, 64, ORDER, 32);

        for (w = 0, i = 0; i < 32; i++)
            w |= v[i] = tmp1[i];

        return w !== 0 ? v : undefined;
    }

    /* Signature verification primitive, calculates Y = vP + hG
     *   v  [in]  signature value
     *   h  [in]  signature hash
     *   P  [in]  public key
     *   Returns signature public key
     */
    function verify (v, h, P) {
        /* Y = v abs(P) + h G  */
        var d = new Array(32);
        var p = [createUnpackedArray(), createUnpackedArray()];
        var s = [createUnpackedArray(), createUnpackedArray()];
        var yx = [createUnpackedArray(), createUnpackedArray(), createUnpackedArray()];
        var yz = [createUnpackedArray(), createUnpackedArray(), createUnpackedArray()];
        var t1 = [createUnpackedArray(), createUnpackedArray(), createUnpackedArray()];
        var t2 = [createUnpackedArray(), createUnpackedArray(), createUnpackedArray()];

        var vi = 0, hi = 0, di = 0, nvh = 0, i, j, k;

        /* set p[0] to G and p[1] to P  */

        set(p[0], 9);
        unpack(p[1], P);

        /* set s[0] to P+G and s[1] to P-G  */

        /* s[0] = (Py^2 + Gy^2 - 2 Py Gy)/(Px - Gx)^2 - Px - Gx - 486662  */
        /* s[1] = (Py^2 + Gy^2 + 2 Py Gy)/(Px - Gx)^2 - Px - Gx - 486662  */

        x_to_y2(t1[0], t2[0], p[1]); /* t2[0] = Py^2  */
        sqrt(t1[0], t2[0]); /* t1[0] = Py or -Py  */
        j = is_negative(t1[0]); /*      ... check which  */
        add(t2[0], t2[0], C39420360); /* t2[0] = Py^2 + Gy^2  */
        mul(t2[1], BASE_2Y, t1[0]); /* t2[1] = 2 Py Gy or -2 Py Gy  */
        sub(t1[j], t2[0], t2[1]); /* t1[0] = Py^2 + Gy^2 - 2 Py Gy  */
        add(t1[1 - j], t2[0], t2[1]); /* t1[1] = Py^2 + Gy^2 + 2 Py Gy  */
        cpy(t2[0], p[1]); /* t2[0] = Px  */
        sub(t2[0], t2[0], C9); /* t2[0] = Px - Gx  */
        sqr(t2[1], t2[0]); /* t2[1] = (Px - Gx)^2  */
        recip(t2[0], t2[1], 0); /* t2[0] = 1/(Px - Gx)^2  */
        mul(s[0], t1[0], t2[0]); /* s[0] = t1[0]/(Px - Gx)^2  */
        sub(s[0], s[0], p[1]); /* s[0] = t1[0]/(Px - Gx)^2 - Px  */
        sub(s[0], s[0], C486671); /* s[0] = X(P+G)  */
        mul(s[1], t1[1], t2[0]); /* s[1] = t1[1]/(Px - Gx)^2  */
        sub(s[1], s[1], p[1]); /* s[1] = t1[1]/(Px - Gx)^2 - Px  */
        sub(s[1], s[1], C486671); /* s[1] = X(P-G)  */
        mul_small(s[0], s[0], 1); /* reduce s[0] */
        mul_small(s[1], s[1], 1); /* reduce s[1] */

        /* prepare the chain  */
        for (i = 0; i < 32; i++) {
            vi = (vi >> 8) ^ (v[i] & 0xFF) ^ ((v[i] & 0xFF) << 1);
            hi = (hi >> 8) ^ (h[i] & 0xFF) ^ ((h[i] & 0xFF) << 1);
            nvh = ~(vi ^ hi);
            di = (nvh & (di & 0x80) >> 7) ^ vi;
            di ^= nvh & (di & 0x01) << 1;
            di ^= nvh & (di & 0x02) << 1;
            di ^= nvh & (di & 0x04) << 1;
            di ^= nvh & (di & 0x08) << 1;
            di ^= nvh & (di & 0x10) << 1;
            di ^= nvh & (di & 0x20) << 1;
            di ^= nvh & (di & 0x40) << 1;
            d[i] = di & 0xFF;
        }

        di = ((nvh & (di & 0x80) << 1) ^ vi) >> 8;

        /* initialize state */
        set(yx[0], 1);
        cpy(yx[1], p[di]);
        cpy(yx[2], s[0]);
        set(yz[0], 0);
        set(yz[1], 1);
        set(yz[2], 1);

        /* y[0] is (even)P + (even)G
         * y[1] is (even)P + (odd)G  if current d-bit is 0
         * y[1] is (odd)P + (even)G  if current d-bit is 1
         * y[2] is (odd)P + (odd)G
         */

        vi = 0;
        hi = 0;

        /* and go for it! */
        for (i = 32; i-- !== 0;) {
            vi = (vi << 8) | (v[i] & 0xFF);
            hi = (hi << 8) | (h[i] & 0xFF);
            di = (di << 8) | (d[i] & 0xFF);

            for (j = 8; j-- !== 0;) {
                mont_prep(t1[0], t2[0], yx[0], yz[0]);
                mont_prep(t1[1], t2[1], yx[1], yz[1]);
                mont_prep(t1[2], t2[2], yx[2], yz[2]);

                k = ((vi ^ vi >> 1) >> j & 1)
                    + ((hi ^ hi >> 1) >> j & 1);
                mont_dbl(yx[2], yz[2], t1[k], t2[k], yx[0], yz[0]);

                k = (di >> j & 2) ^ ((di >> j & 1) << 1);
                mont_add(t1[1], t2[1], t1[k], t2[k], yx[1], yz[1],
                    p[di >> j & 1]);

                mont_add(t1[2], t2[2], t1[0], t2[0], yx[2], yz[2],
                    s[((vi ^ hi) >> j & 2) >> 1]);
            }
        }

        k = (vi & 1) + (hi & 1);
        recip(t1[0], yz[k], 0);
        mul(t1[1], yx[k], t1[0]);

        var Y = [];
        pack(t1[1], Y);
        return Y;
    }

    /* Key-pair generation
     *   P  [out] your public key
     *   s  [out] your private key for signing
     *   k  [out] your private key for key agreement
     *   k  [in]  32 random bytes
     * s may be NULL if you don't care
     *
     * WARNING: if s is not NULL, this function has data-dependent timing */
    function keygen (k) {
        var P = [];
        var s = [];
        k = k || [];
        clamp(k);
        core(P, s, k, null);

        return { p: P, s: s, k: k };
    }

    return {
        sign: sign,
        verify: verify,
        keygen: keygen
    };
}();
