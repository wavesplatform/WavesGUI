// Copyright (c) 2007 Michele Bini
// Konstantin Welke, 2008:
// - moved into .js file, renamed all c255lname to curve25519_name
// - added curve25519_clamp()
// - functions to read from/to 8bit string
// - removed base32/hex functions (cleanup)
// - removed setbit function (cleanup, had a bug anyway)
// BloodyRookie 2014:
// - ported part of the java implementation by Dmitry Skiba to js and merged into this file 
// - profiled for higher speed
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along
// with this program; if not, write to the Free Software Foundation, Inc.,
// 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA. */
//
// The original curve25519 library was released into the public domain
// by Daniel J. Bernstein


curve25519_zero = function() {
  return [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
}

curve25519_one = function() {
  return [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
}

curve25519_two = function() {
  return [2,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
}

curve25519_nine = function() {
  return [9,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
}

curve25519_486671 = function() {
  return [27919,7,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
}

curve25519_39420360 = function() {
  return [33224,601,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
}

curve25519_r2y = function() {
  return [0x1670,0x4000,0xf219,0xd369,0x2248,0x4845,0x679a,0x884d,0x5d19,0x16bf,0xda74,0xe57d,0x5e53,0x3705,0x3526,0x17c0];
}

curve25519_2y = function() {
  return [0x583b,0x0262,0x74bb,0xac2c,0x3c9b,0x2507,0x6503,0xdb85,0x5d66,0x116e,0x45a7,0x3fc2,0xf296,0x8ebe,0xccbc,0x3ea3];
}

curve25519_clamp = function(curve) {
  curve[0] &= 0xFFF8;
  curve[15] &= 0x7FFF;
  curve[15] |= 0x4000;
  return curve;
}

curve25519_getbit = function(curve, c) {
  return ~~(curve[~~(c / 16)] / Math.pow(2, c % 16)) % 2;
}
  
curve25519_prime = [0xffff-18, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0xffff, 0x7fff];

/* group order (a prime near 2^252+2^124) */
curve25519_order = [
	    237, 211, 245, 92, 26, 99, 18, 88, 214, 156, 247, 162, 222, 249, 222, 20,
	    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16];

curve25519_order_times_8 = [
	    104, 159, 174, 231, 210, 24, 147, 192, 178, 230, 188, 23, 245, 206, 247, 166,
	    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128];


curve25519_convertToByteArray = function(a) {
	var b = new Int8Array(32);
	var i;
	for (i=0; i<16; i++)
	{
		b[2*i] = a[i] & 0xff;
		b[2*i+1] = a[i] >> 8;
	}
	
	return b;
}

curve25519_convertToShortArray = function(a) {
	var b = new Array(16);
	var i, val1, val2;
	for (i=0; i<16; i++)
	{
		val1 = a[i*2];
		if (val1 < 0)
		{
			val1 +=256;
		}
		val2 = a[i*2+1];
		if (val2 < 0)
		{
			val2 +=256;
		}
		b[i] = val1 + val2*256;
	}
	return b;
	
}

curve25519_fillShortArray = function(src, dest) {
	var i;
	for (i=0; i<16; i++)
	{
		dest[i] = src[i];
	}
}

curve25519_fillByteArray = function(src, dest) {
	var i;
	for (i=0; i<32; i++)
	{
		dest[i] = src[i];
	}
}

curve25519_log16 = function(text, a) {
	var b = shortArray_to_hex_string(a);
	addText(text + b);
}

curve25519_log32 = function(text, a) {
	var b = byteArray_to_hex_string(a);
	addText(text + b);
}

curve25519_cpy32 = function(a) {
	var b = new Int8Array(32);
	for (i = 0; i < 32; i++)
	{
		b[i] = a[i];
	}
	return b;
}

curve25519_mula_small = function(p, q, m, x, n, z) {
	var v=0;
	for (j=0; j<n; ++j) 
	{
		v += (q[j+m] & 0xFF) + z * (x[j] & 0xFF);
		p[j+m] = (v & 0xFF);
		v >>= 8;
	}
	return v;		
}

curve25519_mula32 = function(p, x, y, t, z) {
	var n = 31;
	var w = 0;
	for (i=0; i < t; i++) 
	{
		zy = z * (y[i] & 0xFF);
		w += curve25519_mula_small(p, p, i, x, n, zy) + (p[i+n] & 0xFF) + zy * (x[n] & 0xFF);
		p[i+n] = (w & 0xFF);
		w >>= 8;
	}
	p[i+n] = ((w + (p[i+n] & 0xFF)) & 0xFF);
	return w >> 8;
}

curve25519_divmod = function(q, r, n, d, t) {
	var rn = 0, z=0;
	var dt = ((d[t-1] & 0xFF) << 8);
	if (t>1) 
	{
		dt |= (d[t-2] & 0xFF);
	}
	while (n-- >= t) 
	{
		z = (rn << 16) | ((r[n] & 0xFF) << 8);
		if (n>0) 
		{
			z |= (r[n-1] & 0xFF);
		}
		z = parseInt(z/dt);
		rn += curve25519_mula_small(r,r, n-t+1, d, t, -z);
		q[n-t+1] = ((z + rn) & 0xFF); // rn is 0 or -1 (underflow)
		curve25519_mula_small(r,r, n-t+1, d, t, -rn);
		rn = (r[n] & 0xFF);
		r[n] = 0;
	}
	r[t-1] = (rn & 0xFF);
}

curve25519_numsize = function(x, n)  {
	while (n--!=0 && x[n]==0)
		;
	return n+1;
}

curve25519_egcd32 = function(x, y, a, b) {
	var an = 0, bn = 32, qn=0, i=0;
	for (i = 0; i < 32; i++)
	{
		x[i] = y[i] = 0;
	}
	x[0] = 1;
	an = curve25519_numsize(a, 32);
	if (an==0)
	{
		return y;	// division by zero
	}
	temp=new Int8Array(32);
	while (true) 
	{
		qn = bn - an + 1;
		curve25519_divmod(temp, b, bn, a, an);
		bn = curve25519_numsize(b, bn);
		if (bn==0)
		{
			return x;
		}
		curve25519_mula32(y, x, temp, qn, -1);

		qn = an - bn + 1;
		curve25519_divmod(temp, a, an, b, bn);
		an = curve25519_numsize(a, an);
		if (an==0)
		{
			return y;
		}
		curve25519_mula32(x, y, temp, qn, -1);
	}
}

curve25519_compare = function (a ,b) {
  var c;
  for (c = 15; c >= 0; c--) {
    var x = a[c];
    var y = b[c];
    if (x > y) {
      return 1;
    }
    if (x < y) {
      return -1;
    }
  }
  return 0;
}

curve25519_cpy16 = function(a) {
	var r = new Array(16);
	var i;
	for (i=0; i<16;i++)
	{
		r[i] = a[i];
	}
	return r;
}

/***
 * BloodyRookie: odd numbers are negativ
 */
curve25519_isNegative = function(x) {
	return (x[0] & 1);
}

curve25519_isOverflow = function(x) {
	if (x[15] >= 0x8000) return 1;
	if (x[0] >= 0x10000)
	{
		var i;
		for (i=1; i<15; i++)
		{
			if (x[i] < 0xFFFF)
			{
				return 0;
			}
		}
		return 1;
	}
	else	
	{
		return 0;
	}
}

curve25519_sqr8h = function (r, a7, a6, a5, a4, a3, a2, a1, a0) {
  var v=0;
  r[0] = (v = a0*a0) & 0xffff;
  r[1] = (v = ~~(v / 0x10000) + 2*a0*a1) & 0xffff;
  r[2] = (v = ~~(v / 0x10000) + 2*a0*a2 + a1*a1) & 0xffff;
  r[3] = (v = ~~(v / 0x10000) + 2*a0*a3 + 2*a1*a2) & 0xffff;
  r[4] = (v = ~~(v / 0x10000) + 2*a0*a4 + 2*a1*a3 + a2*a2) & 0xffff;
  r[5] = (v = ~~(v / 0x10000) + 2*a0*a5 + 2*a1*a4 + 2*a2*a3) & 0xffff;
  r[6] = (v = ~~(v / 0x10000) + 2*a0*a6 + 2*a1*a5 + 2*a2*a4 + a3*a3) & 0xffff;
  r[7] = (v = ~~(v / 0x10000) + 2*a0*a7 + 2*a1*a6 + 2*a2*a5 + 2*a3*a4) & 0xffff;
  r[8] = (v = ~~(v / 0x10000) + 2*a1*a7 + 2*a2*a6 + 2*a3*a5 + a4*a4) & 0xffff;
  r[9] = (v = ~~(v / 0x10000) + 2*a2*a7 + 2*a3*a6 + 2*a4*a5) & 0xffff;
  r[10] = (v = ~~(v / 0x10000) + 2*a3*a7 + 2*a4*a6 + a5*a5) & 0xffff;
  r[11] = (v = ~~(v / 0x10000) + 2*a4*a7 + 2*a5*a6) & 0xffff;
  r[12] = (v = ~~(v / 0x10000) + 2*a5*a7 + a6*a6) & 0xffff;
  r[13] = (v = ~~(v / 0x10000) + 2*a6*a7) & 0xffff;
  r[14] = (v = ~~(v / 0x10000) + a7*a7) & 0xffff;
  r[15] = ~~(v / 0x10000);
}

curve25519_sqrmodp = function(r, a) {
  var x = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var y = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var z = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  curve25519_sqr8h(x, a[15], a[14], a[13], a[12], a[11], a[10], a[9], a[8]);
  curve25519_sqr8h(z, a[7], a[6], a[5], a[4], a[3], a[2], a[1], a[0]);
  curve25519_sqr8h(y, a[15] + a[7], a[14] + a[6], a[13] + a[5], a[12] + a[4], a[11] + a[3], a[10] + a[2], a[9] + a[1], a[8] + a[0]);
  var v=0;
  r[0] = (v = 0x800000 + z[0] + (y[8] -x[8] -z[8] + x[0] -0x80) * 38) & 0xffff;
  r[1] = (v = 0x7fff80 + ~~(v / 0x10000) + z[1] + (y[9] -x[9] -z[9] + x[1]) * 38) & 0xffff;
  r[2] = (v = 0x7fff80 + ~~(v / 0x10000) + z[2] + (y[10] -x[10] -z[10] + x[2]) * 38) & 0xffff;
  r[3] = (v = 0x7fff80 + ~~(v / 0x10000) + z[3] + (y[11] -x[11] -z[11] + x[3]) * 38) & 0xffff;
  r[4] = (v = 0x7fff80 + ~~(v / 0x10000) + z[4] + (y[12] -x[12] -z[12] + x[4]) * 38) & 0xffff;
  r[5] = (v = 0x7fff80 + ~~(v / 0x10000) + z[5] + (y[13] -x[13] -z[13] + x[5]) * 38) & 0xffff;
  r[6] = (v = 0x7fff80 + ~~(v / 0x10000) + z[6] + (y[14] -x[14] -z[14] + x[6]) * 38) & 0xffff;
  r[7] = (v = 0x7fff80 + ~~(v / 0x10000) + z[7] + (y[15] -x[15] -z[15] + x[7]) * 38) & 0xffff;
  r[8] = (v = 0x7fff80 + ~~(v / 0x10000) + z[8] + y[0] -x[0] -z[0] + x[8] * 38) & 0xffff;
  r[9] = (v = 0x7fff80 + ~~(v / 0x10000) + z[9] + y[1] -x[1] -z[1] + x[9] * 38) & 0xffff;
  r[10] = (v = 0x7fff80 + ~~(v / 0x10000) + z[10] + y[2] -x[2] -z[2] + x[10] * 38) & 0xffff;
  r[11] = (v = 0x7fff80 + ~~(v / 0x10000) + z[11] + y[3] -x[3] -z[3] + x[11] * 38) & 0xffff;
  r[12] = (v = 0x7fff80 + ~~(v / 0x10000) + z[12] + y[4] -x[4] -z[4] + x[12] * 38) & 0xffff;
  r[13] = (v = 0x7fff80 + ~~(v / 0x10000) + z[13] + y[5] -x[5] -z[5] + x[13] * 38) & 0xffff;
  r[14] = (v = 0x7fff80 + ~~(v / 0x10000) + z[14] + y[6] -x[6] -z[6] + x[14] * 38) & 0xffff;
  r[15] = 0x7fff80 + ~~(v / 0x10000) + z[15] + y[7] -x[7] -z[7] + x[15] * 38;
  curve25519_reduce(r);
}

curve25519_mul8h = function(r, a7, a6, a5, a4, a3, a2, a1, a0, b7, b6, b5, b4, b3, b2, b1, b0) {
  var v=0;
  r[0] = (v = a0*b0) & 0xffff;
  r[1] = (v = ~~(v / 0x10000) + a0*b1 + a1*b0) & 0xffff;
  r[2] = (v = ~~(v / 0x10000) + a0*b2 + a1*b1 + a2*b0) & 0xffff;
  r[3] = (v = ~~(v / 0x10000) + a0*b3 + a1*b2 + a2*b1 + a3*b0) & 0xffff;
  r[4] = (v = ~~(v / 0x10000) + a0*b4 + a1*b3 + a2*b2 + a3*b1 + a4*b0) & 0xffff;
  r[5] = (v = ~~(v / 0x10000) + a0*b5 + a1*b4 + a2*b3 + a3*b2 + a4*b1 + a5*b0) & 0xffff;
  r[6] = (v = ~~(v / 0x10000) + a0*b6 + a1*b5 + a2*b4 + a3*b3 + a4*b2 + a5*b1 + a6*b0) & 0xffff;
  r[7] = (v = ~~(v / 0x10000) + a0*b7 + a1*b6 + a2*b5 + a3*b4 + a4*b3 + a5*b2 + a6*b1 + a7*b0) & 0xffff;
  r[8] = (v = ~~(v / 0x10000) + a1*b7 + a2*b6 + a3*b5 + a4*b4 + a5*b3 + a6*b2 + a7*b1) & 0xffff;
  r[9] = (v = ~~(v / 0x10000) + a2*b7 + a3*b6 + a4*b5 + a5*b4 + a6*b3 + a7*b2) & 0xffff;
  r[10] = (v = ~~(v / 0x10000) + a3*b7 + a4*b6 + a5*b5 + a6*b4 + a7*b3) & 0xffff;
  r[11] = (v = ~~(v / 0x10000) + a4*b7 + a5*b6 + a6*b5 + a7*b4) & 0xffff;
  r[12] = (v = ~~(v / 0x10000) + a5*b7 + a6*b6 + a7*b5) & 0xffff;
  r[13] = (v = ~~(v / 0x10000) + a6*b7 + a7*b6) & 0xffff;
  r[14] = (v = ~~(v / 0x10000) + a7*b7) & 0xffff;
  r[15] = ~~(v / 0x10000);
}

curve25519_mulmodp = function(r, a, b) {
  var x = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var y = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var z = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  curve25519_mul8h(x, a[15], a[14], a[13], a[12], a[11], a[10], a[9], a[8], b[15], b[14], b[13], b[12], b[11], b[10], b[9], b[8]);
  curve25519_mul8h(z, a[7], a[6], a[5], a[4], a[3], a[2], a[1], a[0], b[7], b[6], b[5], b[4], b[3], b[2], b[1], b[0]);
  curve25519_mul8h(y, a[15] + a[7], a[14] + a[6], a[13] + a[5], a[12] + a[4], a[11] + a[3], a[10] + a[2], a[9] + a[1], a[8] + a[0],
                   b[15] + b[7], b[14] + b[6], b[13] + b[5], b[12] + b[4], b[11] + b[3], b[10] + b[2], b[9] + b[1], b[8] + b[0]);
  var v=0;
  r[0] = (v = 0x800000 + z[0] + (y[8] -x[8] -z[8] + x[0] -0x80) * 38) & 0xffff;
  r[1] = (v = 0x7fff80 + ~~(v / 0x10000) + z[1] + (y[9] -x[9] -z[9] + x[1]) * 38) & 0xffff;
  r[2] = (v = 0x7fff80 + ~~(v / 0x10000) + z[2] + (y[10] -x[10] -z[10] + x[2]) * 38) & 0xffff;
  r[3] = (v = 0x7fff80 + ~~(v / 0x10000) + z[3] + (y[11] -x[11] -z[11] + x[3]) * 38) & 0xffff;
  r[4] = (v = 0x7fff80 + ~~(v / 0x10000) + z[4] + (y[12] -x[12] -z[12] + x[4]) * 38) & 0xffff;
  r[5] = (v = 0x7fff80 + ~~(v / 0x10000) + z[5] + (y[13] -x[13] -z[13] + x[5]) * 38) & 0xffff;
  r[6] = (v = 0x7fff80 + ~~(v / 0x10000) + z[6] + (y[14] -x[14] -z[14] + x[6]) * 38) & 0xffff;
  r[7] = (v = 0x7fff80 + ~~(v / 0x10000) + z[7] + (y[15] -x[15] -z[15] + x[7]) * 38) & 0xffff;
  r[8] = (v = 0x7fff80 + ~~(v / 0x10000) + z[8] + y[0] -x[0] -z[0] + x[8] * 38) & 0xffff;
  r[9] = (v = 0x7fff80 + ~~(v / 0x10000) + z[9] + y[1] -x[1] -z[1] + x[9] * 38) & 0xffff;
  r[10] = (v = 0x7fff80 + ~~(v / 0x10000) + z[10] + y[2] -x[2] -z[2] + x[10] * 38) & 0xffff;
  r[11] = (v = 0x7fff80 + ~~(v / 0x10000) + z[11] + y[3] -x[3] -z[3] + x[11] * 38) & 0xffff;
  r[12] = (v = 0x7fff80 + ~~(v / 0x10000) + z[12] + y[4] -x[4] -z[4] + x[12] * 38) & 0xffff;
  r[13] = (v = 0x7fff80 + ~~(v / 0x10000) + z[13] + y[5] -x[5] -z[5] + x[13] * 38) & 0xffff;
  r[14] = (v = 0x7fff80 + ~~(v / 0x10000) + z[14] + y[6] -x[6] -z[6] + x[14] * 38) & 0xffff;
  r[15] = 0x7fff80 + ~~(v / 0x10000) + z[15] + y[7] -x[7] -z[7] + x[15] * 38;
  curve25519_reduce(r);
}

curve25519_mulasmall = function(r, a, m) {
  var v=0;
  r[0] = (v = a[0] * m) & 0xffff;
  r[1] = (v = ~~(v / 0x10000) + a[1]*m) & 0xffff;
  r[2] = (v = ~~(v / 0x10000) + a[2]*m) & 0xffff;
  r[3] = (v = ~~(v / 0x10000) + a[3]*m) & 0xffff;
  r[4] = (v = ~~(v / 0x10000) + a[4]*m) & 0xffff;
  r[5] = (v = ~~(v / 0x10000) + a[5]*m) & 0xffff;
  r[6] = (v = ~~(v / 0x10000) + a[6]*m) & 0xffff;
  r[7] = (v = ~~(v / 0x10000) + a[7]*m) & 0xffff;
  r[8] = (v = ~~(v / 0x10000) + a[8]*m) & 0xffff;
  r[9] = (v = ~~(v / 0x10000) + a[9]*m) & 0xffff;
  r[10] = (v = ~~(v / 0x10000) + a[10]*m) & 0xffff;
  r[11] = (v = ~~(v / 0x10000) + a[11]*m) & 0xffff;
  r[12] = (v = ~~(v / 0x10000) + a[12]*m) & 0xffff;
  r[13] = (v = ~~(v / 0x10000) + a[13]*m) & 0xffff;
  r[14] = (v = ~~(v / 0x10000) + a[14]*m) & 0xffff;
  r[15] = ~~(v / 0x10000) + a[15]*m;
  curve25519_reduce(r);
}

curve25519_addmodp = function(r, a, b) {
  var v=0;
  r[0] = (v = (~~(a[15] / 0x8000) + ~~(b[15] / 0x8000)) * 19 + a[0] + b[0]) & 0xffff;
  r[1] = (v = ~~(v / 0x10000) + a[1] + b[1]) & 0xffff;
  r[2] = (v = ~~(v / 0x10000) + a[2] + b[2]) & 0xffff;
  r[3] = (v = ~~(v / 0x10000) + a[3] + b[3]) & 0xffff;
  r[4] = (v = ~~(v / 0x10000) + a[4] + b[4]) & 0xffff;
  r[5] = (v = ~~(v / 0x10000) + a[5] + b[5]) & 0xffff;
  r[6] = (v = ~~(v / 0x10000) + a[6] + b[6]) & 0xffff;
  r[7] = (v = ~~(v / 0x10000) + a[7] + b[7]) & 0xffff;
  r[8] = (v = ~~(v / 0x10000) + a[8] + b[8]) & 0xffff;
  r[9] = (v = ~~(v / 0x10000) + a[9] + b[9]) & 0xffff;
  r[10] = (v = ~~(v / 0x10000) + a[10] + b[10]) & 0xffff;
  r[11] = (v = ~~(v / 0x10000) + a[11] + b[11]) & 0xffff;
  r[12] = (v = ~~(v / 0x10000) + a[12] + b[12]) & 0xffff;
  r[13] = (v = ~~(v / 0x10000) + a[13] + b[13]) & 0xffff;
  r[14] = (v = ~~(v / 0x10000) + a[14] + b[14]) & 0xffff;
  r[15] = ~~(v / 0x10000) + a[15] % 0x8000 + b[15] % 0x8000;
}

curve25519_submodp = function(r, a, b) {
  var v=0;
  r[0] = (v = 0x80000 + (~~(a[15] / 0x8000) - ~~(b[15] / 0x8000) - 1) * 19 + a[0] - b[0]) & 0xffff;
  r[1] = (v = ~~(v / 0x10000) + 0x7fff8 + a[1] - b[1]) & 0xffff;
  r[2] = (v = ~~(v / 0x10000) + 0x7fff8 + a[2] - b[2]) & 0xffff;
  r[3] = (v = ~~(v / 0x10000) + 0x7fff8 + a[3] - b[3]) & 0xffff;
  r[4] = (v = ~~(v / 0x10000) + 0x7fff8 + a[4] - b[4]) & 0xffff;
  r[5] = (v = ~~(v / 0x10000) + 0x7fff8 + a[5] - b[5]) & 0xffff;
  r[6] = (v = ~~(v / 0x10000) + 0x7fff8 + a[6] - b[6]) & 0xffff;
  r[7] = (v = ~~(v / 0x10000) + 0x7fff8 + a[7] - b[7]) & 0xffff;
  r[8] = (v = ~~(v / 0x10000) + 0x7fff8 + a[8] - b[8]) & 0xffff;
  r[9] = (v = ~~(v / 0x10000) + 0x7fff8 + a[9] - b[9]) & 0xffff;
  r[10] = (v = ~~(v / 0x10000) + 0x7fff8 + a[10] - b[10]) & 0xffff;
  r[11] = (v = ~~(v / 0x10000) + 0x7fff8 + a[11] - b[11]) & 0xffff;
  r[12] = (v = ~~(v / 0x10000) + 0x7fff8 + a[12] - b[12]) & 0xffff;
  r[13] = (v = ~~(v / 0x10000) + 0x7fff8 + a[13] - b[13]) & 0xffff;
  r[14] = (v = ~~(v / 0x10000) + 0x7fff8 + a[14] - b[14]) & 0xffff;
  r[15] = ~~(v / 0x10000) + 0x7ff8 + a[15]%0x8000 - b[15]%0x8000;
}
/****
 * BloodyRookie: a^-1 is found via Fermats little theorem:
 * a^p congruent a mod p and therefore a^(p-2) congruent a^-1 mod p
 */
curve25519_invmodp = function (r, a, sqrtassist) {
  var r1 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r2 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r3 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r4 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r5 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var i=0;
  curve25519_sqrmodp(r2, a);					//  2 == 2 * 1	
  curve25519_sqrmodp(r3, r2);					//  4 == 2 * 2	
  curve25519_sqrmodp(r1, r3);					//  8 == 2 * 4	
  curve25519_mulmodp(r3, r1, a);				//  9 == 8 + 1	
  curve25519_mulmodp(r1, r3, r2);				// 11 == 9 + 2	
  curve25519_sqrmodp(r2, r1);					// 22 == 2 * 11	
  curve25519_mulmodp(r4, r2, r3);				// 31 == 22 + 9
 												//	== 2^5   - 2^0	
  curve25519_sqrmodp(r2, r4);					// 2^6   - 2^1	
  curve25519_sqrmodp(r3, r2);					// 2^7   - 2^2	
  curve25519_sqrmodp(r2, r3);					// 2^8   - 2^3	
  curve25519_sqrmodp(r3, r2);					// 2^9   - 2^4	
  curve25519_sqrmodp(r2, r3);					// 2^10  - 2^5	
  curve25519_mulmodp(r3, r2, r4);				// 2^10  - 2^0	
  curve25519_sqrmodp(r2, r3);					// 2^11  - 2^1	
  curve25519_sqrmodp(r4, r2);					// 2^12  - 2^2	
  for (i = 1; i < 5; i++) {
	curve25519_sqrmodp(r2, r4);
	curve25519_sqrmodp(r4, r2);
  } 											// 2^20  - 2^10	
  curve25519_mulmodp(r2, r4, r3);				// 2^20  - 2^0	
  curve25519_sqrmodp(r4, r2);					// 2^21  - 2^1	
  curve25519_sqrmodp(r5, r4);					// 2^22  - 2^2	
  for (i = 1; i < 10; i++) {
	curve25519_sqrmodp(r4, r5);
	curve25519_sqrmodp(r5, r4);
  } 											// 2^40  - 2^20	
  curve25519_mulmodp(r4, r5, r2);				// 2^40  - 2^0	
  for (i = 0; i < 5; i++) {
	curve25519_sqrmodp(r2, r4);
	curve25519_sqrmodp(r4, r2);
  } 											// 2^50  - 2^10	
  curve25519_mulmodp(r2, r4, r3);				// 2^50  - 2^0	
  curve25519_sqrmodp(r3, r2);					// 2^51  - 2^1	
  curve25519_sqrmodp(r4, r3);					// 2^52  - 2^2	
  for (i = 1; i < 25; i++) {
	curve25519_sqrmodp(r3, r4);
	curve25519_sqrmodp(r4, r3);
  } 											// 2^100 - 2^50 
  curve25519_mulmodp(r3, r4, r2);				// 2^100 - 2^0	
  curve25519_sqrmodp(r4, r3);					// 2^101 - 2^1	
  curve25519_sqrmodp(r5, r4);					// 2^102 - 2^2	
  for (i = 1; i < 50; i++) {
	curve25519_sqrmodp(r4, r5);
	curve25519_sqrmodp(r5, r4);
  } 											// 2^200 - 2^100 
  curve25519_mulmodp(r4, r5, r3);				// 2^200 - 2^0	
  for (i = 0; i < 25; i++) {
	curve25519_sqrmodp(r5, r4);
	curve25519_sqrmodp(r4, r5);
  } 											// 2^250 - 2^50	
  curve25519_mulmodp(r3, r4, r2);				// 2^250 - 2^0	
  curve25519_sqrmodp(r2, r3);					// 2^251 - 2^1	
  curve25519_sqrmodp(r3, r2);					// 2^252 - 2^2	
  if (sqrtassist == 1) {
	curve25519_mulmodp(r, a, r3);				// 2^252 - 3 
  } else {
	curve25519_sqrmodp(r2, r3);					// 2^253 - 2^3	
	curve25519_sqrmodp(r3, r2);					// 2^254 - 2^4	
	curve25519_sqrmodp(r2, r3);					// 2^255 - 2^5	
	curve25519_mulmodp(r, r2, r1);				// 2^255 - 21	
  }
}

/******
 * BloodyRookie: Finding a square root mod p of x if we already know it exists and p congruent 3 mod 8.
 * Using x^((p-1)/2) congruent 1 mod p and 2^((p-1)/2) congruent -1 mod p
 * because of Eulers criterium we see that when we set v=(2x)^((p-5)/8) then
 * i:=2xv^2 is a square root of -1 and thus r=+xv(i-1) and r=-xv(i-1) are the square roots of x.
 */
curve25519_sqrtmodp = function(r, x) {
  var r1 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r2 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r3 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r4 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  curve25519_addmodp(r1, x,x);								// r1 = 2x
  curve25519_invmodp(r2, r1, 1);							// r2 = (2x)^((p-5)/8) =: v
  curve25519_sqrmodp(r3, r2);								// r3 = v^2
  curve25519_mulmodp(r4, r1, r3);							// r4 = 2xv^2 =: i
  curve25519_submodp(r, r4, curve25519_one());				//  r = i-1
  curve25519_mulmodp(r1, r2, r);							// r1 = v(i-1)
  curve25519_mulmodp(r, x, r1);								//  r = xv(i-1)
}

curve25519_reduce = function (a) {
  curve25519_reduce2(a);
  
  /**
   * BloodyRookie: special case for p <= a < 2^255
   */
  if ((a[15] != 0x7FFF || a[14] != 0xFFFF || a[13] != 0xFFFF || a[12] != 0xFFFF || a[11] != 0xFFFF || a[10] != 0xFFFF || a[9] != 0xFFFF ||  a[8] != 0xFFFF || 
	   a[7] != 0xFFFF  || a[6] != 0xFFFF  || a[5] != 0xFFFF  || a[4] != 0xFFFF  || a[3] != 0xFFFF  || a[2] != 0xFFFF || a[1] != 0xFFFF || a[0] < 0xFFED))
  {
	  return;
  }
  
  var i;
  for (i=1; i<16; i++)
  {
	  a[i] = 0;
  }
  a[0] = a[0] - 0xFFED;
}
curve25519_reduce2 = function (a) {
  var v = a[15];
  if (v < 0x8000) return;
  a[15] = v % 0x8000;
  v = ~~(v / 0x8000) * 19;
  a[0] = (v += a[0]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[1] = (v += a[1]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[2] = (v += a[2]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[3] = (v += a[3]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[4] = (v += a[4]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[5] = (v += a[5]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[6] = (v += a[6]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[7] = (v += a[7]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[8] = (v += a[8]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[9] = (v += a[9]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[10] = (v += a[10]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[11] = (v += a[11]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[12] = (v += a[12]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[13] = (v += a[13]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[14] = (v += a[14]) & 0xffff;
  if ((v = ~~(v / 0x10000)) < 1) return;
  a[15] += v;
}

/**
 * Montgomery curve with A=486662 and B=1
 */
curve25519_x_to_y2 = function(r, x) {
  var r1 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r2 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  curve25519_sqrmodp(r1, x);									// r1 = x^2
  curve25519_mulasmall(r2, x, 486662);							// r2 = Ax
  curve25519_addmodp(r, r1, r2);								//  r = x^2 + Ax
  curve25519_addmodp(r1, r, curve25519_one());					// r1 = x^2 + Ax + 1
  curve25519_mulmodp(r, r1, x);									//  r = x^3 + Ax^2 + x
}

curve25519_prep = function(r, s, a, b) {
  curve25519_addmodp(r, a, b);
  curve25519_submodp(s, a, b);
}

/****
 * BloodyRookie: Doubling a point on a Montgomery curve:
 * Point is given in projective coordinates p=x/z
 * 2*P = r/s, 
 * r = (x+z)^2 * (x-z)^2
 * s = ((((x+z)^2 - (x-z)^2) * 121665) + (x+z)^2) * ((x+z)^2 - (x-z)^2) 
 *   = 4*x*z * (x^2 + 486662*x*z + z^2)
 *   = 4*x*z * ((x-z)^2 + ((486662+2)/4)(4*x*z))
 */
curve25519_dbl = function(r, s, t1, t2) {
  var r1 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r2 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r3 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r4 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  curve25519_sqrmodp(r1, t1);									// r1 = t1^2
  curve25519_sqrmodp(r2, t2);									// r2 = t2^2
  curve25519_submodp(r3, r1, r2);								// r3 = t1^2 - t2^2
  curve25519_mulmodp(r, r2, r1);								//  r = t1^2 * t2^2
  curve25519_mulasmall(r2, r3, 121665);							// r2 = (t1^2 - t2^2) * 121665
  curve25519_addmodp(r4, r2, r1)								// r4 = (t1^2 - t2^2) * 121665 + t1^2
  curve25519_mulmodp(s, r4, r3);								//  s = ((t1^2 - t2^2) * 121665 + t1^2) * (t1^2 - t2^2)
}

/****
 * BloodyRookie: Adding 2 points on a Montgomery curve:
 * R = Q + P = r/s when given
 * Q = x/z, P = x_p/z_p, P-Q = x_1/1
 * r = ((x-z)*(x_p+z_p) + (x+z)*(x_p-z_p))^2
 * s = x_1*((x-z)*(x_p+z_p) - (x+z)*(x_p-z_p))^2
 */
function curve25519_sum(r, s, t1, t2, t3, t4, x_1) {
  var r1 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r2 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r3 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var r4 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  curve25519_mulmodp(r1, t2, t3);								// r1 = t2 * t3
  curve25519_mulmodp(r2, t1, t4);								// r2 = t1 * t4
  curve25519_addmodp(r3, r1, r2);								// r3 = t2 * t3 + t1 * t4
  curve25519_submodp(r4, r1, r2);								// r4 = t2 * t3 - t1 * t4
  curve25519_sqrmodp(r, r3);									//  r = (t2 * t3 + t1 * t4)^2
  curve25519_sqrmodp(r1, r4);									// r1 = (t2 * t3 - t1 * t4)^2
  curve25519_mulmodp(s, r1, x_1);								//  s = (t2 * t3 - t1 * t4)^2 * x_1
}

function curve25519_(f, c, s) {
  var j, a, x_1, q, fb, counter=0; 
  var t = new Array(16), t1 = new Array(16), t2 = new Array(16), t3 = new Array(16), t4 = new Array(16);
  var sb = new Int8Array(32);
  var temp1 = new Int8Array(32);
  var temp2 = new Int8Array(64);
  var temp3 = new Int8Array(64);

  x_1 = c;
  q = [ curve25519_one(), curve25519_zero() ];
  a = [ x_1, curve25519_one() ];

  var n = 255;

  /**********************************************************************
   * BloodyRookie:                                                      *
   * Given f = f0*2^0 + f1*2^1 + ... + f255*2^255 and Basepoint a=9/1   * 
   * calculate f*a by applying the Montgomery ladder (const time algo): *
   * r0 := 0 (point at infinity)                                        *
   * r1 := a                                                            *
   * for i from 255 to 0 do                                             *
   *   if fi = 0 then                                                   *
   *      r1 := r0 + r1                                                 *          
   *      r0 := 2r0                                                     *
   *   else                                                             *
   *      r0 := r0 + r1                                                 *
   *      r1 := 2r1                                                     *
   *                                                                    *
   * Result: r0 = x-coordinate of f*a                                   *
   **********************************************************************/
  var r0 = new Array(new Array(16), new Array(16));
  var r1 = new Array(new Array(16), new Array(16));
  var t1 = new Array(16), t2 = new Array(16);
  var t3 = new Array(16), t4 = new Array(16);
  var fi;
  while (n >= 0) 
  {
    fi = curve25519_getbit(f, n);
    if (fi == 0) 
    {
       curve25519_prep(t1, t2, a[0], a[1]); 
       curve25519_prep(t3, t4, q[0], q[1]); 
       curve25519_sum(r1[0], r1[1], t1, t2, t3, t4, x_1);
       curve25519_dbl(r0[0], r0[1], t3, t4);
    } 
    else 
    {
       curve25519_prep(t1, t2, q[0], q[1]); 
       curve25519_prep(t3, t4, a[0], a[1]); 
       curve25519_sum(r0[0], r0[1], t1, t2, t3, t4, x_1);
       curve25519_dbl(r1[0], r1[1], t3, t4);
    }
    q = r0; a = r1;
    n--;
  }
  curve25519_invmodp(t, q[1], 0);
  curve25519_mulmodp(t1, q[0], t);
  q[0] = curve25519_cpy16(t1);
  
  // q[0]=x-coordinate of k*G=:Px
  // q[1]=z-coordinate of k*G=:Pz
  // a = q + G = P + G
  if (s != null)
  {
	  /*************************************************************************
	   * BloodyRookie: Recovery of the y-coordinate of point P:                *
	   *                                                                       *
	   * If P=(x,y), P1=(x1, y1), P2=(x2,y2) and P2 = P1 + P then              *
	   *                                                                       *
	   * y1 = ((x1 * x + 1)(x1 + x + 2A) - 2A - (x1 - x)^2 * x2)/2y            *
	   *                                                                       *
	   * Setting P2=Q, P1=P and P=G in the above formula we get                *
	   *                                                                       *
	   * Py =  ((Px * Gx + 1) * (Px + Gx + 2A) - 2A - (Px - Gx)^2 * Qx)/(2*Gy) *
	   *    = -((Qx + Px + Gx + A) * (Px - Gx)^2 - Py^2 - Gy^2)/(2*Gy)         *
	   *************************************************************************/
	  t = curve25519_cpy16(q[0]);
	  curve25519_x_to_y2(t1, t);								// t1 = Py^2
	  curve25519_invmodp(t3, a[1], 0);
	  curve25519_mulmodp(t2, a[0], t3);							// t2 = (P+G)x = Qx
	  curve25519_addmodp(t4, t2, t);							// t4 =  Qx + Px
	  curve25519_addmodp(t2, t4, curve25519_486671());			// t2 = Qx + Px + Gx + A  
	  curve25519_submodp(t4, t, curve25519_nine());				// t4 = Px - Gx
	  curve25519_sqrmodp(t3, t4);								// t3 = (Px - Gx)^2
	  curve25519_mulmodp(t4, t2, t3);							// t4 = (Qx + Px + Gx + A) * (Px - Gx)^2
	  curve25519_submodp(t, t4, t1);							//  t = (Qx + Px + Gx + A) * (Px - Gx)^2 - Py^2
	  curve25519_submodp(t4, t, curve25519_39420360());			// t4 = (Qx + Px + Gx + A) * (Px - Gx)^2 - Py^2 - Gy^2
	  curve25519_mulmodp(t1, t4, curve25519_r2y())				// t1 = ((Qx + Px + Gx + A) * (Px - Gx)^2 - Py^2 - Gy^2)/(2Gy) = -Py
	  fb = curve25519_convertToByteArray(f);
	  j = curve25519_isNegative(t1);
	  if (j != 0)
	  {
		  /***
		   * Py is positiv, so just copy
		   */
		  sb = curve25519_cpy32(fb);
	  }
	  else
	  {
		  /***
		   * Py is negative:
		   * We will take s = -f^-1 mod q instead of s=f^-1 mod q
		   */
		  curve25519_mula_small(sb, curve25519_order_times_8, 0, fb, 32, -1);
	  }
	  
	  temp1 = curve25519_cpy32(curve25519_order);
	  temp1 = curve25519_egcd32(temp2, temp3, sb, temp1);
	  sb = curve25519_cpy32(temp1);
	  if ((sb[31] & 0x80)!=0)
	  {
		  curve25519_mula_small(sb, sb, 0, curve25519_order, 32, 1);
	  }
	  var stmp = curve25519_convertToShortArray(sb);
	  curve25519_fillShortArray(stmp, s);
  }

  return q[0];
}

curve25519_keygen = function(s, curve) {
	curve25519_clamp(curve);
	return curve25519_(curve, curve25519_nine(), s);
}

/* Signature generation primitive, calculates (x-h)s mod q
 *   v  [out] signature value
 *   h  [in]  signature hash (of message, signature pub key, and context data)
 *   x  [in]  signature private key
 *   s  [in]  private key for signing
 * returns true on success, false on failure (use different x or h)
 */
curve25519_sign = function(v, h, x, s) {
	tmp1=new Int8Array(65);
	tmp2=new Int8Array(33);
	for (i = 0; i < 32; i++)
	{
		v[i] = 0;
	}
	curve25519_mula_small(v, x, 0, h, 32, -1);
	curve25519_mula_small(v, v, 0, curve25519_order, 32, parseInt((15-v[31])/16));
	curve25519_mula32(tmp1, v, s, 32, 1);
	curve25519_divmod(tmp2, tmp1, 64, curve25519_order, 32);
	w=0;
	for (k = 0; k < 32; k++)
	{
		v[k] = tmp1[k];
		w |= v[k];
	}
	return w != 0;
}

curve25519_verify = function(Y, v, h, P) {
	d=new Int8Array(32);
	yx=new Array(new Array(16), new Array(16), new Array(16));
	yz=new Array(new Array(16), new Array(16), new Array(16));
	var s=new Array(new Array(16), new Array(16));
	var q=new Array(new Array(16), new Array(16));
	var t1=new Array(new Array(16), new Array(16), new Array(16));
	var t2=new Array(new Array(16), new Array(16), new Array(16));
	var vi = 0, hi = 0, di = 0, nvh=0, i=0, j=0, k=0, counter=1;

	/******************************************************************
     * Set s[0] to P+G and s[1] to P-G.                               *
     * If sqrt(Py^2) is negativ we switch s[0] and s[1]               *
	 *                                                                *
     * s[0] = (Py^2 + Gy^2 - 2 Py Gy)/(Px - Gx)^2 - Px - Gx - 486662  *
     * s[1] = (Py^2 + Gy^2 + 2 Py Gy)/(Px - Gx)^2 - Px - Gx - 486662  *
     ******************************************************************/

	var p = [ curve25519_nine(), curve25519_convertToShortArray(P) ];
	curve25519_x_to_y2(q[0], p[1]);								// q[0] = Py^2
	curve25519_sqrtmodp(t1[0], q[0]);							// t1[0] = +-Py
	j = curve25519_isNegative(t1[0]);
	curve25519_addmodp(t2[0], q[0], curve25519_39420360());		// t2[0] = Py^2 + Gy^2
	curve25519_mulmodp(t2[1], curve25519_2y(), t1[0]);			// t2[1] = +-Py * 2Gy
	curve25519_submodp(t1[j], t2[0], t2[1]);					// t1[j] = Py^2 + Gy^2 - +-Py * 2Gy
	curve25519_addmodp(t1[1-j], t2[0], t2[1]);					// t1[1-j] = Py^2 + Gy^2 + +-Py * 2Gy
	q[0] = curve25519_cpy16(p[1]);								// q[0] = Px
	curve25519_submodp(t2[0], q[0], curve25519_nine());			// t2[0] = Px-Gx
	curve25519_sqrmodp(t2[1], t2[0]);							// t2[1] = (Px-Gx)^2
	curve25519_invmodp(t2[0], t2[1], 0);						// t2[0] = 1/(Px-Gx)^2
	curve25519_mulmodp(q[0], t1[0], t2[0]);						// q[0] = (Py^2 + Gy^2 - Py * 2Gy)/(Px-Gx)^2
	curve25519_submodp(q[1], q[0], p[1]);						// q[1] = (Py^2 + Gy^2 - Py * 2Gy)/(Px-Gx)^2 - Px
	curve25519_submodp(s[0], q[1], curve25519_486671());		// s[0] = (Py^2 + Gy^2 - Py * 2Gy)/(Px-Gx)^2 - Px - Gx - A = P+Q
	curve25519_mulmodp(q[0], t1[1], t2[0]);						// q[0] = (Py^2 + Gy^2 + Py * 2Gy)/(Px-Gx)^2
	curve25519_submodp(q[1], q[0], p[1]);						// q[1] = (Py^2 + Gy^2 + Py * 2Gy)/(Px-Gx)^2 - Px
	curve25519_submodp(s[1], q[1], curve25519_486671());		// s[1] = (Py^2 + Gy^2 + Py * 2Gy)/(Px-Gx)^2 - Px - Gx - A = P-Q
	
	/**
	 * Fast algorithm for computing vP+hG
	 */
	for (i = 0; i < 32; i++) 
	{
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
		d[i] = (di & 0xFF);
	}

	di = ((nvh & (di & 0x80) << 1) ^ vi) >> 8;

	/**
	 * yx[0]/yz[0] = point at infinity
	 */
	yx[0] = curve25519_cpy16(curve25519_one());
	yx[1] = curve25519_cpy16(p[di]);
	yx[2] = curve25519_cpy16(s[0]);
	yz[0] = curve25519_cpy16(curve25519_zero());
	yz[1] = curve25519_cpy16(curve25519_one());
	yz[2] = curve25519_cpy16(curve25519_one());
	
	vi = 0;
	hi = 0;

	for (i = 32; i-- != 0; i=i) 
	{
		vi = (vi << 8) | (v[i] & 0xFF);
		hi = (hi << 8) | (h[i] & 0xFF);
		di = (di << 8) | (d[i] & 0xFF);

		for (j = 8; j-- !=0 ; j=j) 
		{
			k = ((vi ^ vi >> 1) >> j & 1) + ((hi ^ hi >> 1) >> j & 1);
			curve25519_prep(t1[0], t2[0], yx[0], yz[0]);
			curve25519_prep(t1[1], t2[1], yx[1], yz[1]);
			curve25519_prep(t1[2], t2[2], yx[2], yz[2]);
			
			curve25519_dbl(yx[0], yz[0], t1[k], t2[k]);
			k = (di >> j & 2) ^ ((di >> j & 1) << 1);
			curve25519_sum(yx[1], yz[1], t1[1], t2[1], t1[k], t2[k], p[di >> j & 1]);
			curve25519_sum(yx[2], yz[2], t1[2], t2[2], t1[0], t2[0], s[((vi ^ hi) >> j & 2) >> 1]);
		}
	}

	k = (vi & 1) + (hi & 1);
	curve25519_invmodp(t1[0], yz[k], 0);
	curve25519_mulmodp(t1[1], yx[k], t1[0]);
	var YY = curve25519_convertToByteArray(t1[1]);
	curve25519_fillByteArray(YY, Y);
}
