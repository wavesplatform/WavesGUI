describe('Wallet.Deposit.Controller', function() {
    var $rootScope, $q, scope, timeout, events, dialogService, controller,
        coinomatService, notificationService, utilsService,
        applicationContext = {
            account: {
                address: '3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq',
                keyPair: {
                    public: 'FJuErRxhV9JaFUwcYLabFK5ENvDRfyJbRz8FeVfYpBLn',
                    private: '9dXhQYWZ5468TRhksJqpGT6nUySENxXi9nsCZH9AefD1'
                }
            }
        };

    // Initialization of the module before each test case
    beforeEach(module('waves.core'));
    beforeEach(module('app.ui'));
    beforeEach(module('app.wallet'));

    // Injection of dependencies
    beforeEach(inject(function($injector, $controller, $timeout) {
        $rootScope = $injector.get('$rootScope');
        $q = $injector.get('$q');
        scope = $rootScope.$new();
        events = $injector.get('wallet.events');
        dialogService = $injector.get('dialogService');
        notificationService = $injector.get('notificationService');
        utilsService = $injector.get('utilsService');
        timeout = $timeout;
        coinomatService = {
            getDepositDetails: function () {}
        };

        spyOn(dialogService, 'open');

        // Emulate mainnet so the popup may be shown
        spyOn(utilsService, 'isTestnet').and.callFake(function () {
            return false;
        });

        controller = $controller('walletDepositController', {
            '$scope': scope,
            '$timeout': timeout,
            'constants.ui': $injector.get('constants.ui'),
            'wallet.events': events,
            'autocomplete.fees': $injector.get('autocomplete.fees'),
            'apiService': $injector.get('apiService'),
            'dialogService': dialogService,
            'transactionBroadcast': $injector.get('transactionBroadcast'),
            'assetService': $injector.get('assetService'),
            'formattingService': $injector.get('formattingService'),
            'notificationService': notificationService,
            'applicationContext': applicationContext,
            'coinomatService': coinomatService,
            'utilsService': utilsService
        });
    }));

    function initControllerAssets(assetBalance, wavesBalance) {
        if (!assetBalance) {
            assetBalance = Money.fromTokens(10, Currency.BTC);
        }

        if (!wavesBalance) {
            wavesBalance = Money.fromTokens(20, Currency.WAVES);
        }

        $rootScope.$broadcast(events.WALLET_DEPOSIT, {
            assetBalance: assetBalance,
            wavesBalance: wavesBalance
        });
    }

    it('should initialize properly', function () {
        expect(controller.btc.bitcoinAddress).toEqual('');
    });

    it('should ask coinomat for payment requisites', function () {
        var deferred = $q.defer();
        spyOn(coinomatService, 'getDepositDetails').and.returnValue(deferred.promise);

        var address = '319287n098r7wer7qve';
        deferred.resolve({address: address});

        initControllerAssets();
        expect(coinomatService.getDepositDetails).toHaveBeenCalled();
        expect(controller.btc.bitcoinAddress).toEqual('');

        $rootScope.$apply();
        expect(controller.btc.bitcoinAddress).toEqual(address);
    });

    it('should handle exceptions', function () {
        var deferred = $q.defer();
        spyOn(coinomatService, 'getDepositDetails').and.returnValue(deferred.promise);
        spyOn(notificationService, 'error');

        var errorMessage = 'Failed to connect';
        deferred.reject(new Error(errorMessage));

        initControllerAssets();
        $rootScope.$apply();

        expect(controller.btc.bitcoinAddress).toEqual('');
        expect(notificationService.error).toHaveBeenCalledWith(errorMessage);
    });
});
