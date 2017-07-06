describe('State.Service', function () {
    var stateService,
        state;

    beforeEach(module('app.state'));

    beforeEach(function () {

        module('mock');
        module('app.state');

        inject(function ($injector) {
            stateService = $injector.get('stateService');
        });

    });

    it('should save account data', function (done) {
        var account = {
            name: 'Test no. 1',
            encodedSeed: 'U2FsdGVkX1/zaprYBQmMMFZRidPd8vvxfZYuc7og1u/adiefrn45Msi+xFxswRXe3P1t9NLkqrfXAL' +
            '3P0baFwRRajC0VZ9JtJXJfaybVZBzleVGxR9gorxjl9jq0dLzv8X51eXOT9UQwWUzlJ6YScg==',
            checksum: '04f1e2ec4bfe9789134eaace0d11c07c5aa606b007f03b5ec1aeb096b713992e',
            publicKey: 'A5s7vVre3b5WKssR5Kfu5J8oYdwvWx9UF1zmuZgvqcrB',
            address: '3MqqQcbtJeGh9sf43EU1A4UL35u2dTF2oYm'
        };

        state = stateService.getState();

        state.get('account')
            .then(function (data) {
                expect(data).toEqual(null);
            })
            .then(done);
        // .then(function () {
        //   return state.set('account', account);
        // })
        // .then(function () {
        //   return state.get('account');
        // });
        // .then(function (data) {
        //   expect(data.name).toEqual(account.name);
        //   expect(data.encodedSeed).toEqual(account.encodedSeed);
        //   expect(data.publicKey).toEqual(account.publicKey);
        //   done();
        // });
    });
});
