describe('Crypto.Service', function() {
    var cryptoService;

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
});

