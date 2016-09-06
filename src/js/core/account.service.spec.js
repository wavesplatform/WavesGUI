describe('AccountService', function() {
    var mockStorage, accountService;

    var clone = function (object) {
        return JSON.parse(JSON.stringify(object));
    };

    // Initialization of a mock storage before each test case
    beforeEach(function() {
        mockStorage = {
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

    beforeEach(angular.mock.module(function($provide) {
        $provide.service('storageService', function() {
            this.saveState = function(state, onSuccessCallback) {
                mockStorage = clone(state);
                onSuccessCallback(mockStorage);
            };

            this.loadState = function (onDataReadCallback) {
                onDataReadCallback(clone(mockStorage));
            };
        });
    }));

    // Injection of dependencies
    beforeEach(inject(function($injector) {
        accountService = $injector.get('accountService');
    }));

    it('should add new accounts properly', function (done) {
        var newAccount = {
            name: 'NewAccount',
            address: 'WWW'
        };

        accountService.addAccount(newAccount, function () {
            expect(mockStorage.accounts.length).toEqual(3);
            expect(mockStorage.accounts[2]).toEqual(newAccount);
            done();
        });
    });

    it('should remove accounts properly', function (done) {
        expect(function() { accountService.removeAccount(-1); }).toThrow();
        expect(function() { accountService.removeAccount(2); }).toThrow();

        accountService.removeAccount(1, function () {
            expect(mockStorage.accounts.length).toEqual(1);
        });

        accountService.removeAccount(0, function () {
            expect(mockStorage.accounts.length).toEqual(0);
            expect(function() { accountService.removeAccount(0); }).toThrow();
            done();
        });
    });

    it('should load all available accounts', function (done) {
        accountService.getAccounts(function (accounts) {
            expect(accounts.length).toEqual(2);
            expect(accounts).toEqual(mockStorage.accounts);

            done();
        });
    });
});
