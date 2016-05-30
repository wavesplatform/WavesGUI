describe("libaxolotl curve implementation", function () {


    it("generates correct private and public keys", function () {

        // this keys is for "secretPhrase877282999374" secret phrase
        var privateKey = Base58.decode("Hkn4PnmBgnyg59qsunBB4V4xhf5bobVdPWQvC3f5L3YZ");

        var pair = curve25519.generateKeyPair(privateKey.buffer);

        expect(Base58.encode(new Uint8Array(pair.private))).toEqual('Hkn4PnmBgnyg59qsunBB4V4xhf5bobVdPWQvC3f5L3YZ');
        expect(Base58.encode(new Uint8Array(pair.public))).toEqual('HGsmhwkdoLzKtAQVePcSr75Pj25dVMf8RPE4CzbCPVXi');
    });


    it("signing", function () {
        var privateKey = Base58.decode("Hkn4PnmBgnyg59qsunBB4V4xhf5bobVdPWQvC3f5L3YZ");
        var publicKey = Base58.decode("HGsmhwkdoLzKtAQVePcSr75Pj25dVMf8RPE4CzbCPVXi");

        var message = new Uint8Array([10, 12, 11, 12, 1, 2, 33, 22, 98, 56]);

        var signatureBuffer = curve25519.sign(privateKey.buffer, message.buffer);
        var sig = new Uint8Array(signatureBuffer);
        expect(Base58.encode(sig)).toEqual("219HjtkLJv41ovXZSGuwaQKpz9kNkJCbms6uoSkD3EzhtuC7bYktPMntN1NjeS88Rtv767xbbiq81zhfrn8LKmKZ");

        expect(curve25519.verifySignature(publicKey.buffer, message.buffer, signatureBuffer)).toEqual(true);
    });
});
