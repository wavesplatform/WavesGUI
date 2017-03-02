describe('Bitcoin.Uri.Service', function () {
    var bitcoinUriService;

    // Initialization of the module before each test case
    beforeEach(module('app.shared'));

    // Injection of dependencies
    beforeEach(inject(function($injector) {
        bitcoinUriService = $injector.get('bitcoinUriService');
    }));

    it('should return an empty string when given no address', function () {
        expect(bitcoinUriService.generate('')).toEqual('');
    });

    it('should return an empty string when given a non-string value for an address', function () {
        expect(bitcoinUriService.generate(5)).toEqual('');
    });

    it('should return a simple URI when given only an address', function () {
        expect(bitcoinUriService.generate('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'))
            .toEqual('bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2');
    });

    it('should return a URI with amount when given an address and amount', function () {
        expect(bitcoinUriService.generate('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', {
            amount: 10.5
        })).toEqual('bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2?amount=10.5');
    });
});
