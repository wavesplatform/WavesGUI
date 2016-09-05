describe('LocalStorage.Html5.Service', function() {
    var mockState, storageService;

    // Initialization of a mock storage before each test case
    beforeEach(function() {
        mockState = {
            accounts: [
                {
                    name: 'TestAccount1',
                    address: 'XYZ'
                },
                {
                    name: 'TestAccount2',
                    address: 'ZYX'
                }]
        };
    });

    // Initialization of the module before each test case
    beforeEach(module('app.core.services'));

    // Injection of dependencies
    beforeEach(inject(function($injector) {
        storageService = $injector.get('html5StorageService');
    }));

    it('Save and load work properly', function (done) {
        var newAccount = {
            name: 'NewAccount',
            address: 'WWW'
        };

        storageService.saveState(mockState, function () {
            storageService.loadState(function (readState) {
                expect(readState).toEqual(mockState);

                readState.accounts.push(newAccount);

                storageService.saveState(readState, function () {
                    storageService.loadState(function (freshState) {
                        expect(freshState.accounts.length).toEqual(3);
                        expect(freshState.accounts[2]).toEqual(newAccount);

                        storageService.clear(function() {
                            done();
                        });
                    });
                });
            });
        });
    });
});
