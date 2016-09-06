describe('Crypto.Service', function() {
    var cryptoService, constants = {
        INITIAL_NONCE: 0,
        ADDRESS_VERSION: 1
    };

    function keyGenerationTestCase(encodedSeed, encodedExpectedPrivateKey, encodedExpectedPublicKey) {
        var seedBytes = cryptoService.base58.decode(encodedSeed);
        var privateKey = cryptoService.buildPrivateKey(seedBytes);
        var publicKey = cryptoService.buildPublicKey(seedBytes);

        expect(privateKey).toEqual(encodedExpectedPrivateKey);
        expect(publicKey).toEqual(encodedExpectedPublicKey);
    }

    function hashingTestCase(encodedNoncedSeed, encodedExpectedHash) {
        var seedBytes = cryptoService.base58.decode(encodedNoncedSeed);
        var hashBytes = cryptoService.hashChain(seedBytes);

        expect(cryptoService.base58.encode(hashBytes)).toEqual(encodedExpectedHash);
    }

    function encryptionTestCase(encryptedSeed, checksum, expectedSeed) {
        var password = 'Zz123456';
        expect(cryptoService.decryptWalletSeed(encryptedSeed, password, checksum)).toEqual(expectedSeed);
    }

    // Initialization of the module before each test case
    beforeEach(module('app.core.services'));

    // overriding app.core module constants
    beforeEach(angular.mock.module('app.core', function ($provide) {
        $provide.constant('constants.core', constants);
    }));

    // Injection of dependencies
    beforeEach(inject(function($injector) {
        cryptoService = $injector.get('cryptoService');
    }));

    it('after base58.decode->base58.encode should have the original data', function() {
        var data = 'eRBWQTV4m1RwEfLtzrhyg3CMjWhpsPqAe';
        expect(cryptoService.base58.encode(cryptoService.base58.decode(data))).toEqual(data);
    });

    it('should correctly decode base58 string to byte array', function() {
        var decoded = cryptoService.base58.decode('eRBWQTV4m1RwEfLtzrhyg3CMjWhpsPqAe');
        var bytes = new Uint8Array([1, 154, 111, 104, 105, 163, 239, 25, 72, 17, 240, 65, 206, 120, 235, 129, 70, 16,
            247, 248, 180, 109, 210, 38, 95]);
        expect(decoded).toEqual(bytes);
    });

    it('should correctly get blake2b-256 hashes', function() {
        var data = new Uint8Array([]);
        expect(toHex(cryptoService.blake2b(data, null, 32)))
            .toEqual('0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8');

        var data2 = new Uint8Array([97, 98, 99]);
        expect(toHex(cryptoService.blake2b(data2, null, 32)))
            .toEqual('bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319');
    });

    it('generates correct private and public keys', function() {
        keyGenerationTestCase(
            'sfRTzgCRLuWEbYBtnmnt7DecxvKazTMEScJpnFWaacCFWy36E83iGR8F6bKrQtwc2yuKmKo1vQBV8cFca4K8eoy',
            'YoLY4iripseWvtMt29sc89oJnjxzodDgQ9REmEPFHkK',
            '3qTkgmBYFjdSEtib9C4b3yHiEexyJ59A5ZVjSvXsg569');
        keyGenerationTestCase(
            'QJLRHJVdAAxSucSzaBtDBhGDNiehe61vpFdHongK88jBa6ckZz5a57Hbb8PKtBL26dgAkJpsrX7Z9LT6egX2XAz',
            'EVLXAcnJgnV1KUJasidEY4myaKwvh2d3p8CPc6srC32A',
            '7CPECZ633JRSM39HrB8axeJMZWixBeo2p9bWfwwVAhYj');
        keyGenerationTestCase(
            '3bMpEZd31VLXnrFsPsqSANWzkHvkzwZ6GzGvMHZri7zUGkZuQbe9MQF86K1pkB36oy9LMQNfoXNsQhHzv1VMj7TF',
            '98JtkrkqGqunaJqtN7J2kvJeUnvrTkpobDVArGXTVFa1',
            'FKKmKKWsVBPFWufcTTJjoQZDjMG9jmgzAbFPjQm9DVj8');
    });

    it('generates expected hash for a predefined seed', function () {
        hashingTestCase('aVYPRLnqyyV367BssHsKUnkRgXXQYJcxSMgCuzZBBSD7ELnCzvMNmNKcjySu8fjYcERZCzvjqir5n2eCavh9oy4q4ro8B',
            'Cyw5mgkYiAsCKvKZveGvAD9bjNconFUduJDBLvTGAFXS');
        hashingTestCase('aVYPRLKUtvmfPK19KWBPjtXqmrbt9u2kmUKqagvpVuEeQ5KjXrQWM2fUmqFbJ2E5fhtqbQzPcZq4otaKWzht1T9TGkfVC',
            'Be8depGda1e9d5BVYJ55YXZmvRZTezaBTHHyJpmpqPgy');
        hashingTestCase('aVYPRNWYNk3yvhLJtr83AHqVKonhtRwxsmdJf36qnxiRaUKbGfRWTeJg3jGLLhFQGXaGhHiggxhKXrwU5ZQZVTkomhtaC',
            '5Afu7yvvwckWDabWG3LHFqLMBHy8uoyxiVahdNo39rp9');
    });

    it('encrypt and decrypt messages reversibly', function () {
        var message = 'The quick brown fox jumps over the lazy dog';
        var key = 'SuperSecretPassword';

        var encryptedMessage = cryptoService.encryptWalletSeed(message, key);
        var checksum = cryptoService.seedChecksum(message);

        expect(cryptoService.decryptWalletSeed(encryptedMessage, key, checksum)).toEqual(message);
    });

    it('computes the seed checksum in the same way as before', function () {
        var seed = 'wing obey ride sorry entry road anger news basket mom kitchen stomach mean gun jar';
        expect(cryptoService.seedChecksum(seed))
            .toEqual('1de6b0a314b07362549d85c2859f1a45030dad34f2144daa26b5c057055a300a');
    });

    it('should correctly validate old accounts and stored seeds', function () {
        encryptionTestCase('U2FsdGVkX19KYaUIB83aL17T159aNqHKp5gDvAFcng9F01vU71oauyIbnJQon7xMTR/Ze9unc7qsgkeImV/' +
            'LZj0RXnPP6VFJpvAbIL40VcnWf6xYrAI0g5Xyzna3YgVKVbHUkyRDtYU0lSSrplcEGg==',
            '1de6b0a314b07362549d85c2859f1a45030dad34f2144daa26b5c057055a300a',
            'wing obey ride sorry entry road anger news basket mom kitchen stomach mean gun jar');
        encryptionTestCase('U2FsdGVkX1+eeb7DpHoNqha5rFvEB8K1s8Mx4JZ9HaBuala1x+AvshftX2x4FQg84lZozT492QM6M6XhQcLR' +
            'TkSuLKPSVR8iwmD7VJns+1ohBeE7a6vID5+YquzxdDAJuC3MzKEB9Wd78SeVVa7S7Y8xgXLA6jVbMznnBJcY60M=',
            '8e27eaac4203d86052b582cbff8c338a1a438ae03753934354d2035cf7ba75aa',
            'endless resource crash ready sweet entire apology bicycle effort grape siege eight left purchase aspect');
        encryptionTestCase('U2FsdGVkX18JkUZs5yoWBIcqHCe0+ewhsVbZyyCXCH/Fm/xDdSoEwwT+JopDOZS3qK22b9aIBBiDfcTC/YlZv' +
            'Uy7J0YTc1dypNOaffUsmflHi6Hf57+ShANCV5WKtPwM/VWuasmle3HJpVBKDKUpZj60VAdzlw14Y4abv3obpWw=',
            '87fdbb8b9d073d04f5a2e6da2803954758adeaedb5b3a4b0c08a292b30d4bd48',
            'spot prefer tube decrease ride wall moral prize brain dinner screen approve glimpse void decorate');
        encryptionTestCase('U2FsdGVkX1/gIM0SKshkENu5A2KGJfrW5h+EEXq89x9PyWFHENjdMNq0di7e1iwXHJkhrhwpSJcO00olezpw' +
            'PKs28nrElmdfWu60+hERsC+yXoJzi6tMUt209ARbAMyLv4PDK2s9gt+K70Mc/fh2Xwt4YnyFTA94EPSkg1x6U7Q=',
            'bc7174cdffa4e98337b510bc381f55ec58046520b8850fa098c054d560d3fe52',
            'nature salon bright ice coach cricket snack check ordinary bleak document else moment what excite');
        encryptionTestCase('U2FsdGVkX1/5XfjiHkfTFhGCTeJ3nhQPFUoavWcU8e/u4hKWo5av6sCCV4HMVzuwRSTukB4MPyWL5XiK76Im' +
            'XrZ050/ZvpR0XeTbNZCdijwAnlvMDAnEF/FxeMHLIb6nfSMFbGFuM8L8jRiqF4ENrA==',
            'a3d4dce6345761d7bbfaf2c306c12e731adbb18a0648118481a68ea6b5a61914',
            'unlock wasp wet engine syrup badge depth credit possible elder harvest ready fire divert member');
    });

    it('deterministic transaction signature is the same as computed by the backend', function () {
        var messageBytes = cryptoService.base58.decode('Psm3kB61bTJnbBZo3eE6fBGg8vAEAG');
        var publicKey = cryptoService.base58.decode('biVxMhzqLPDVS8hs9w5TtjXxtmNqeoHX21kHRDmszzV');
        var privateKey = cryptoService.base58.decode('4nAEobwe4jB5Cz2FXDzGDEPge89YaWm9HhKwsFyeHwoc');

        var signature = cryptoService.deterministicSign(privateKey, messageBytes);
        expect(cryptoService.verify(publicKey, messageBytes, cryptoService.base58.decode(signature))).toBe(true);
        expect(signature)
            .toEqual('2HhyaYcKJVEPVgoPkjN3ZCVYKaobwxavLFnn75if6D95Nrc2jHAwX72inxsZpv9KVpMASqQfDB5KRqfkJutz5iav');

        signature = cryptoService.nonDeterministicSign(privateKey, messageBytes);
        expect(cryptoService.verify(publicKey, messageBytes, cryptoService.base58.decode(signature))).toBe(true);
    });

    it('should generate network addresses locally', function() {
        // testing testnet address generation
        constants.NETWORK_CODE = 'T';
        expect(cryptoService.buildRawAddress('5ug8nQ1ubfjAZVJFed4mcXVVEBz53DfV8nBQWuKbt2AJ'))
            .toEqual('3Mtkz8KeXUZmTbNH1MFcrMGv4t1av5tmaFL');
        expect(cryptoService.buildRawAddress('9iDrC31brcunVTRCq69iUngg1S5Ai1rd6iX7vTwAGTvn'))
            .toEqual('3N33kaYS3C9pvVsVjLKLApmRQHfzm3UY36N');
        expect(cryptoService.buildRawAddress('Dq5f76Ro3qQCPWSDrCNrVDCiKwNFKCP2UmnVZzPxVf8'))
            .toEqual('3NBmgsTgGv8nfmYzbCiKvTuBJtDpVyyxqKr');
        expect(cryptoService.buildRawAddress('6tk94Rwij3FXwfaJLWu9PhQAHDY2MUjPLYkHQ28HaRk3'))
            .toEqual('3MstHyC4tKtBhzbWdhrJ3jkxPD1hYSJCi77');
        expect(cryptoService.buildRawAddress('2oGDrLRdBsU9Nb32jgPMh3TrQXm9QifUBLnLijfWqY5e'))
            .toEqual('3MzUpwpiNTr32YWoYVmRFyzJQgdDbti3shP');
        expect(cryptoService.buildRawAddress('71m88eJxbfJnNPW87r4Qtrp9Q2qa1wsLYmrxXRAzLPF6'))
            .toEqual('3MwJXUURjZY2BmbMDRMwgGnJ19RZC9Hdg3V');
        expect(cryptoService.buildRawAddress('7Ftuept6hfNEhSeVA439asPWZQVuteqWQUEPz6RGHsAo'))
            .toEqual('3MpETHR7opAMN6dWqJejq1X37YCkq6Nu5hK');
        expect(cryptoService.buildRawAddress('AEYsMR1171SmhV77rDtBTyfjmFubzirpHqFH4hV1aDt9'))
            .toEqual('3MyciTA8STrTWjZ46KdoZ1ASf5GuY7sD8be');

        // testing mainnet address generation
        constants.NETWORK_CODE = 'W';
        expect(cryptoService.buildRawAddress('D1vnz91YRXyDM72R6ZsPZfj1woMzL5nZtFrfeGQYjMs6'))
            .toEqual('3PKGL4nMz3sMESQXPzmX5GKbiQtCi2Tu9Z5');
        expect(cryptoService.buildRawAddress('9Emin4uvu2cew67hkpkX2ZKV6NJEjyP7Uvzbf8ARMCc6'))
            .toEqual('3P9oRcFxwjW58bqu1oXyk1JrRTy8ADSKvdN');
    });
});
