describe(`Bitcoin.Uri.Service`, () => {
    'use strict';

    let bitcoinUriService;

    // Initialization of the module before each test case
    beforeEach(module(`app.shared`));

    // Injection of dependencies
    beforeEach(inject(($injector) => {
        bitcoinUriService = $injector.get(`bitcoinUriService`);
    }));

    it(`should return an empty string when given no address`, () => {
        expect(bitcoinUriService.generate(``)).toEqual(``);
    });

    it(`should return an empty string when given a non-string value for an address`, () => {
        expect(bitcoinUriService.generate(5)).toEqual(``);
    });

    it(`should return a simple URI when given only an address`, () => {
        expect(bitcoinUriService.generate(`1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2`))
            .toEqual(`bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2`);
    });

    it(`should return a URI with amount when given an address and amount`, () => {
        expect(bitcoinUriService.generate(`1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2`, {
            amount: 10.5
        })).toEqual(`bitcoin:1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2?amount=10.5`);
    });
});
