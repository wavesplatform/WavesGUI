describe("waves.address", function() {

    var rawAddress = 'YyHCqgBqhp3kX9asUMYUQKvxuAj13ytnN';
    var displayAddress = '1WYyHCqgBqhp3kX9asUMYUQKvxuAj13ytnN';

    it("should throw an error if the address is incorrect", function () {
        //expect(function () { new WavesAddress(undefined) }).toThrow(new Error("address must be defined"));
        // address length is 34
        expect(function () { new WavesAddress('YyHCqgBqhp3kX9asUMYUQKvxuAj13ytnNq') }).toThrow(new Error("address is malformed"));
        // illegal symbols in address
        expect(function () { new WavesAddress('YyHCqgBqhp3kX9asU$YUQKvxuAj13ytnN') }).toThrow(new Error("address is malformed"));
        // address length is 32 (33 is expected)
        expect(function () { new WavesAddress('YyHCqgBqhp3kX9asUMYUQKvxuAj13ytn') }).toThrow(new Error("address is malformed"));
    });

    it("should add a correct prefix if address is ok", function () {
        var address = new WavesAddress(rawAddress);
        expect(address.getDisplayAddress()).toEqual(displayAddress);
        expect(address.getRawAddress()).toEqual(rawAddress);
        expect(new WavesAddress().fromRawAddress(rawAddress).getDisplayAddress()).toEqual(displayAddress);
    });

    it("should parse address from a displayAddress", function() {
        expect(new WavesAddress().fromDisplayAddress(displayAddress).getRawAddress()).toEqual(rawAddress)
    })
});
