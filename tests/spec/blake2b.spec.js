describe("blake2b", function() {


    it("blake2b-256", function() {

        var data = new Uint8Array([]);
        expect(toHex(blake2b(data, null, 32))).toEqual('0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8');

        var data2 = new Uint8Array([97, 98, 99]);
        expect(toHex(blake2b(data2, null, 32))).toEqual('bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319');

    });


});
