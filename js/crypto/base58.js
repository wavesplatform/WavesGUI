/*
 * base58.js
 *  - encodes integers to and decodes from a base58 (or your own) base58 alphabet
 *  - based on Flickr's url shortening
 * 
 * usage:
 *   base58.encode(integer);
 *   base58.decode(string);
 * 
 * (c) 2012 inflammable/raromachine
 * Licensed under the MIT License.
 * 
 */

var base58 = (function(alpha) {
    var alphabet = alpha || '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ',
        base = alphabet.length;
    return {
        encode: function(enc) {
            if(typeof enc!=='number' || enc !== parseInt(enc))
                throw '"encode" only accepts integers.';
            var encoded = '';
            while(enc) {
                var remainder = enc % base;
                enc = Math.floor(enc / base);
                encoded = alphabet[remainder].toString() + encoded;        
            }
            return encoded;
        },
        decode: function(dec) {
            if(typeof dec!=='string')
                throw '"decode" only accepts strings.';            
            var decoded = 0;
            while(dec) {
                var alphabetPosition = alphabet.indexOf(dec[0]);
                if (alphabetPosition < 0)
                    throw '"decode" can\'t find "' + dec[0] + '" in the alphabet: "' + alphabet + '"';
                var powerOf = dec.length - 1;
                decoded += alphabetPosition * (Math.pow(base, powerOf));
                dec = dec.substring(1);
            }
            return decoded;
        }
    };
})();