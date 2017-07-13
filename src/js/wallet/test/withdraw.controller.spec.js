describe(`Wallet.Withdraw.Controller`, () => {
    'use strict';

    let $rootScope, $q, scope, timeout, events, dialogService, ctrl, coinomatService, notificationService, formMock;

    const gatewayAddress = `3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq`;
    const bitcoinAddress = `14qViLJfdGaP4EeHnDyJbEGQysnCpwn1gZ`;
    const depositAddress = `mhqqhhuKPGCoEa7wwkxfGSbYWEccKcCDFd`;

    const applicationContext = {
        account: {
            keyPair: {
                public: `FJuErRxhV9JaFUwcYLabFK5ENvDRfyJbRz8FeVfYpBLn`,
                private: `9dXhQYWZ5468TRhksJqpGT6nUySENxXi9nsCZH9AefD1`
            }
        }
    };

    // Initialization of the module before each test case
    beforeEach(module(`waves.core`));
    beforeEach(module(`app.wallet`));

    // Injection of dependencies
    beforeEach(inject(($injector, $controller, $timeout) => {
        $rootScope = $injector.get(`$rootScope`);
        $q = $injector.get(`$q`);
        scope = $rootScope.$new();
        events = $injector.get(`wallet.events`);
        dialogService = $injector.get(`dialogService`);
        notificationService = $injector.get(`notificationService`);
        timeout = $timeout;
        coinomatService = {
            getWithdrawRate: _.identity,
            getWithdrawDetails: _.identity,
            getDepositDetails: _.identity
        };
        formMock = {
            invalid() {
                return {};
            },
            validate() {
                return true;
            }
        };

        spyOn(dialogService, `open`);

        ctrl = $controller(`walletWithdrawController`, {
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
            'coinomatService': coinomatService
        });
    }));

    function initControllerAssets(assetBalance, wavesBalance) {
        if (!assetBalance) {
            assetBalance = Money.fromTokens(10, Currency.BTC);
        }

        if (!wavesBalance) {
            wavesBalance = Money.fromTokens(20, Currency.WAVES);
        }

        $rootScope.$broadcast(events.WALLET_WITHDRAW, {
            assetBalance,
            wavesBalance
        });
    }

    function initRateServiceMock() {
        const response = {
            xrate: 1,
            in_min: 0.1,
            in_max: 100,
            in_def: 10,
            fee_in: 0,
            fee_out: 0.0001,
            from_txt: `LTC`,
            to_txt: `Webmoney VND`,
            in_prec: {
                dec: 8,
                correction: 1
            },
            out_prec: {
                dec: 2,
                correction: 1000000
            }
        };

        const deferred = $q.defer();
        spyOn(coinomatService, `getWithdrawRate`).and.returnValue(deferred.promise);
        deferred.resolve(response);
    }

    function initWithdrawAddressMock() {
        const deferred = $q.defer();
        spyOn(coinomatService, `getWithdrawDetails`).and.returnValue(deferred.promise);
        deferred.resolve({ address: gatewayAddress });
    }

    function initDepositDetailsMock() {
        const deferred = $q.defer();
        spyOn(coinomatService, `getDepositDetails`).and.returnValue(deferred.promise);
        deferred.resolve({ address: depositAddress });
    }

    it(`should initialize properly`, () => {
        expect(ctrl.address).toEqual(``);
    });

    it(`should request exchange rates on init`, () => {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets();
        $rootScope.$apply();

        expect(coinomatService.getWithdrawRate).toHaveBeenCalled();
        expect(dialogService.open).toHaveBeenCalled();
        expect(ctrl.exchangeRate).toEqual(1);
        expect(ctrl.feeIn).toEqual(0);
        expect(ctrl.feeOut).toEqual(0.0001);
        expect(ctrl.amount).toEqual(`9.9999`);
        expect(ctrl.total).toEqual(10);
        expect(ctrl.validationOptions.rules.withdrawAmount.decimal).toEqual(Currency.BTC.precision);
        expect(ctrl.validationOptions.rules.withdrawAmount.min).toEqual(0.1);
        expect(ctrl.validationOptions.rules.withdrawAmount.max).toEqual(10);
    });

    it(`should show a message if exchange rate request has failed`, () => {
        const deferred = $q.defer();
        spyOn(coinomatService, `getWithdrawRate`).and.returnValue(deferred.promise);
        spyOn(notificationService, `error`);

        const errorResponse = { data: { error: `Failed to get exchange rate` } };
        deferred.reject(errorResponse);

        initControllerAssets();
        initDepositDetailsMock();
        $rootScope.$apply();

        expect(notificationService.error).toHaveBeenCalledWith(errorResponse.error);
        expect(dialogService.open).not.toHaveBeenCalled();
    });

    it(`should check available balance on confirm withdraw`, () => {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets(undefined, Money.fromTokens(1, Currency.WAVES));
        $rootScope.$apply();

        spyOn(ctrl.autocomplete, `getFeeAmount`).and.returnValue(`1.001`);
        spyOn(notificationService, `error`).and.returnValue(undefined);

        expect(ctrl.confirmWithdraw(formMock)).toBe(false);
        timeout.flush();
        expect(dialogService.open).not.toHaveBeenCalledWith(`#withdraw-confirmation`);
    });

    it(`should not confirm withdraw in case the form is invalid`, () => {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets();
        $rootScope.$apply();

        spyOn(ctrl.autocomplete, `getFeeAmount`).and.returnValue(`1.001`);
        spyOn(notificationService, `error`).and.returnValue(undefined);
        spyOn(formMock, `validate`).and.returnValue(false);

        expect(ctrl.confirmWithdraw(formMock)).toBe(false);
        timeout.flush();
        expect(dialogService.open).not.toHaveBeenCalledWith(`#withdraw-confirmation`);
        expect(notificationService.error).not.toHaveBeenCalled();
    });

    it(`should check bitcoin address on confirm`, () => {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets();
        $rootScope.$apply();

        ctrl.address = undefined;
        expect(ctrl.confirmWithdraw(formMock)).toBe(false);

        ctrl.address = `198ynwv8yq0wef`;
        expect(ctrl.confirmWithdraw(formMock)).toBe(false);
    });

    it(`should check bitcoin address in not a deposit one`, () => {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets();
        $rootScope.$apply();

        ctrl.address = depositAddress;
        expect(ctrl.confirmWithdraw(formMock)).toBe(false);
    });

    it(`should show a confirmation dialog on confirm withdraw`, () => {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets();
        $rootScope.$apply();

        spyOn(ctrl.autocomplete, `getFeeAmount`).and.returnValue(`0.002`);
        ctrl.recipient = bitcoinAddress;
        ctrl.amount = `9.99`;
        initWithdrawAddressMock();
        expect(ctrl.confirmWithdraw(formMock)).toBe(true);
        $rootScope.$apply();

        expect(ctrl.confirm.amount.toTokens()).toEqual(10);
        expect(ctrl.confirm.amount.currency).toEqual(Currency.BTC);
        expect(ctrl.confirm.fee.toTokens()).toEqual(0.002);
        expect(ctrl.confirm.fee.currency).toEqual(Currency.WAVES);
        expect(ctrl.confirm.recipient).toEqual(bitcoinAddress);
        expect(ctrl.confirm.gatewayAddress).toEqual(gatewayAddress);
        expect(dialogService.open).toHaveBeenCalledWith(`#withdraw-confirmation`);
    });

    it(`should handle errors on confirm withdraw`, () => {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets();
        $rootScope.$apply();

        const deferred = $q.defer();
        spyOn(coinomatService, `getWithdrawDetails`).and.returnValue(deferred.promise);
        spyOn(notificationService, `error`);

        const errorMessage = `Failed to get tunnel`;
        deferred.reject(new Error(errorMessage));

        spyOn(ctrl.autocomplete, `getFeeAmount`).and.returnValue(`0.002`);
        ctrl.recipient = bitcoinAddress;
        ctrl.amount = `9.99`;

        expect(ctrl.confirmWithdraw(formMock)).toBe(true);
        $rootScope.$apply();

        expect(notificationService.error).toHaveBeenCalledWith(errorMessage);
        expect(dialogService.open).not.toHaveBeenCalledWith(`#withdraw-confirmation`);
        expect(ctrl.confirm.gatewayAddress).toEqual(``);
    });

});
