describe('Address.Service', function() {
    var addressService;
    var rawAddress = '2n2MhfqjsXnjffZi8DcyziZikt7KRFufuMj';
    var displayAddress = '1W2n2MhfqjsXnjffZi8DcyziZikt7KRFufuMj';

    // Initialization of the module before each test case
    beforeEach(module('app.core.services'));

    // Injection of dependencies
    beforeEach(inject(function($injector) {
        addressService = $injector.get('addressService');
    }));

    it('should throw an error if the address is incorrect', function () {
        // address length is 36 (35 is expected)
        expect(function () { addressService.fromRawAddress('2n2MhfqjsXnjffZi8DcyziZikt7KRFufuMjq'); })
            .toThrow(new Error('Raw address is malformed'));
        // illegal symbols in address
        expect(function () { addressService.fromRawAddress('YyHCqgBqhp3kX9asU$YUQKvxuAj13ytnN'); })
            .toThrow(new Error('Raw address is malformed'));
        // address length is 34 (35 is expected)
        expect(function () { addressService.fromRawAddress('2n2MhfqjsXnjffZi8DcyziZikt7KRFufuM'); })
            .toThrow(new Error('Raw address is malformed'));
    });

    it('should add a correct prefix if address is ok', function () {
        var address = addressService.fromRawAddress(rawAddress);
        expect(address.getDisplayAddress()).toEqual(displayAddress);
        expect(address.getRawAddress()).toEqual(rawAddress);
        expect(addressService.fromRawAddress(rawAddress).getDisplayAddress()).toEqual(displayAddress);
    });

    it('should parse address from a displayAddress', function() {
        expect(addressService.fromDisplayAddress(displayAddress).getRawAddress()).toEqual(rawAddress);
    });
});

