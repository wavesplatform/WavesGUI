describe("waves.address", function() {

    var rawAddress = '2n2MhfqjsXnjffZi8DcyziZikt7KRFufuMj';
    var displayAddress = '1W2n2MhfqjsXnjffZi8DcyziZikt7KRFufuMj';

    it("should throw an error if the address is incorrect", function () {
        expect(function () { new WaveAddress(undefined) }).toThrow(new Error("Address must be defined"));
        // address length is 36 (35 is expected)
        expect(function () { Waves.Addressing.fromRawAddress('2n2MhfqjsXnjffZi8DcyziZikt7KRFufuMjq') }).toThrow(new Error("Raw address is malformed"));
        // illegal symbols in address
        expect(function () { Waves.Addressing.fromRawAddress('YyHCqgBqhp3kX9asU$YUQKvxuAj13ytnN') }).toThrow(new Error("Raw address is malformed"));
        // address length is 34 (35 is expected)
        expect(function () { Waves.Addressing.fromRawAddress('2n2MhfqjsXnjffZi8DcyziZikt7KRFufuM') }).toThrow(new Error("Raw address is malformed"));
    });

    it("should add a correct prefix if address is ok", function () {
        var address = Waves.Addressing.fromRawAddress(rawAddress);
        expect(address.getDisplayAddress()).toEqual(displayAddress);
        expect(address.getRawAddress()).toEqual(rawAddress);
        expect(Waves.Addressing.fromRawAddress(rawAddress).getDisplayAddress()).toEqual(displayAddress);
    });

    it("should parse address from a displayAddress", function() {
        expect(Waves.Addressing.fromDisplayAddress(displayAddress).getRawAddress()).toEqual(rawAddress);
    });
});
