describe(`Wallet.Deposit.Controller`, () => {
    'use strict';

    let $rootScope, $q, scope, timeout, events, dialogService, ctrl;
    let coinomatService, notificationService, utilsService;

    const applicationContext = {
        account: {
            address: `3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq`,
            keyPair: {
                public: `FJuErRxhV9JaFUwcYLabFK5ENvDRfyJbRz8FeVfYpBLn`,
                private: `9dXhQYWZ5468TRhksJqpGT6nUySENxXi9nsCZH9AefD1`
            }
        }
    };

    // Initialization of the module before each test case
    beforeEach(module(`waves.core`));
    beforeEach(module(`app.ui`));
    beforeEach(module(`app.wallet`));

    // Injection of dependencies
    beforeEach(inject(($injector, $controller, $timeout) => {
        $rootScope = $injector.get(`$rootScope`);
        $q = $injector.get(`$q`);
        scope = $rootScope.$new();
        events = $injector.get(`wallet.events`);
        dialogService = $injector.get(`dialogService`);
        notificationService = $injector.get(`notificationService`);
        utilsService = $injector.get(`utilsService`);
        timeout = $timeout;
        coinomatService = {
            getDepositDetails: _.identity
        };

        spyOn(dialogService, `open`);

        // Emulate mainnet so the popup may be shown
        spyOn(utilsService, `isTestnet`).and.callFake(() => false);

        ctrl = $controller(`walletDepositController`, {
            '$scope': scope,
            '$timeout': timeout,
            'constants.ui': $injector.get(`constants.ui`),
            'wallet.events': events,
            'autocomplete.fees': $injector.get(`autocomplete.fees`),
            'apiService': $injector.get(`apiService`),
            'dialogService': dialogService,
            'transactionBroadcast': $injector.get(`transactionBroadcast`),
            'assetService': $injector.get(`assetService`),
            'formattingService': $injector.get(`formattingService`),
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
            assetBalance,
            wavesBalance
        });
    }

    it(`should initialize properly`, () => {
        expect(ctrl.btc.bitcoinAddress).toEqual(``);
    });

    it(`should ask coinomat for payment requisites`, () => {
        const deferred = $q.defer();
        spyOn(coinomatService, `getDepositDetails`).and.returnValue(deferred.promise);

        const address = `319287n098r7wer7qve`;
        deferred.resolve({address});

        initControllerAssets();
        expect(coinomatService.getDepositDetails).toHaveBeenCalled();
        expect(ctrl.btc.bitcoinAddress).toEqual(``);

        $rootScope.$apply();
        expect(ctrl.btc.bitcoinAddress).toEqual(address);
    });

    it(`should handle exceptions`, () => {
        const deferred = $q.defer();
        spyOn(coinomatService, `getDepositDetails`).and.returnValue(deferred.promise);
        spyOn(notificationService, `error`);

        const errorMessage = `Failed to connect`;
        deferred.reject(new Error(errorMessage));

        initControllerAssets();
        $rootScope.$apply();

        expect(ctrl.btc.bitcoinAddress).toEqual(``);
        expect(notificationService.error).toHaveBeenCalledWith(errorMessage);
    });
});
