describe('Wallet.Withdraw.Controller', function() {
    var $rootScope, $q, scope, timeout, events, dialogService, controller, coinomatService, notificationService,
        formMock, applicationContext = {
            account: {
                keyPair: {
                    public: 'FJuErRxhV9JaFUwcYLabFK5ENvDRfyJbRz8FeVfYpBLn',
                    private: '9dXhQYWZ5468TRhksJqpGT6nUySENxXi9nsCZH9AefD1'
                }
            }
        };
    var gatewayAddress = '3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq';
    var bitcoinAddress = '14qViLJfdGaP4EeHnDyJbEGQysnCpwn1gZ';
    var depositAddress = 'mhqqhhuKPGCoEa7wwkxfGSbYWEccKcCDFd';

    // Initialization of the module before each test case
    beforeEach(module('waves.core'));
    beforeEach(module('app.wallet'));

    // Injection of dependencies
    beforeEach(inject(function($injector, $controller, $timeout) {
        $rootScope = $injector.get('$rootScope');
        $q = $injector.get('$q');
        scope = $rootScope.$new();
        events = $injector.get('wallet.events');
        dialogService = $injector.get('dialogService');
        notificationService = $injector.get('notificationService');
        timeout = $timeout;
        coinomatService = {
            getWithdrawRate: function () {},
            getWithdrawDetails: function () {},
            getDepositDetails: function () {}
        };
        formMock = {
            invalid: function () {
                return {};
            },
            validate: function (options) {
                return true;
            }
        };

        spyOn(dialogService, 'open');

        controller = $controller('walletWithdrawController', {
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
            'coinomatService': coinomatService
        });
    }));

    function initControllerAssets(assetBalance, wavesBalance) {
        if (!assetBalance)
            assetBalance = Money.fromTokens(10, Currency.BTC);

        if (!wavesBalance)
            wavesBalance = Money.fromTokens(20, Currency.WAV);

        $rootScope.$broadcast(events.WALLET_WITHDRAW, {
            assetBalance: assetBalance,
            wavesBalance: wavesBalance
        });
    }

    function initRateServiceMock() {
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        var response = {
            xrate: 1,
            in_min: 0.1,
            in_max: 100,
            in_def: 10,
            fee_in: 0,
            fee_out: 0.0001,
            from_txt: 'LTC',
            to_txt: 'Webmoney VND',
            in_prec: {
                dec: 8,
                correction: 1
            },
            out_prec: {
                dec: 2,
                correction: 1000000
            }
        };
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

        var deferred = $q.defer();
        spyOn(coinomatService, 'getWithdrawRate').and.returnValue(deferred.promise);
        deferred.resolve(response);
    }

    function initWithdrawAddressMock() {
        var deferred = $q.defer();
        spyOn(coinomatService, 'getWithdrawDetails').and.returnValue(deferred.promise);
        deferred.resolve({address: gatewayAddress});
    }

    function initDepositDetailsMock () {
        var deferred = $q.defer();
        spyOn(coinomatService, 'getDepositDetails').and.returnValue(deferred.promise);
        deferred.resolve({address: depositAddress});
    }

    it('should initialize properly', function () {
        expect(controller.address).toEqual('');
    });

    it('should request exchange rates on init', function () {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets();
        $rootScope.$apply();

        expect(coinomatService.getWithdrawRate).toHaveBeenCalled();
        expect(dialogService.open).toHaveBeenCalled();
        expect(controller.exchangeRate).toEqual(1);
        expect(controller.feeIn).toEqual(0);
        expect(controller.feeOut).toEqual(0.0001);
        expect(controller.amount).toEqual('9.9999');
        expect(controller.total).toEqual(10);
        expect(controller.validationOptions.rules.withdrawAmount.decimal).toEqual(Currency.BTC.precision);
        expect(controller.validationOptions.rules.withdrawAmount.min).toEqual(0.1);
        expect(controller.validationOptions.rules.withdrawAmount.max).toEqual(10);
    });

    it('should show a message if exchange rate request has failed', function () {
        var deferred = $q.defer();
        spyOn(coinomatService, 'getWithdrawRate').and.returnValue(deferred.promise);
        spyOn(notificationService, 'error');

        var errorResponse = {data: {error: 'Failed to get exchange rate'}};
        deferred.reject(errorResponse);

        initControllerAssets();
        initDepositDetailsMock();
        $rootScope.$apply();

        expect(notificationService.error).toHaveBeenCalledWith(errorResponse.error);
        expect(dialogService.open).not.toHaveBeenCalled();
    });

    it('should check available balance on confirm withdraw', function () {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets(undefined, Money.fromTokens(1, Currency.WAV));
        $rootScope.$apply();

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('1.001');
        spyOn(notificationService, 'error').and.returnValue(undefined);

        expect(controller.confirmWithdraw(formMock)).toBe(false);
        timeout.flush();
        expect(dialogService.open).not.toHaveBeenCalledWith('#withdraw-confirmation');
    });

    it('should not confirm withdraw in case the form is invalid', function () {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets();
        $rootScope.$apply();

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('1.001');
        spyOn(notificationService, 'error').and.returnValue(undefined);
        spyOn(formMock, 'validate').and.returnValue(false);

        expect(controller.confirmWithdraw(formMock)).toBe(false);
        timeout.flush();
        expect(dialogService.open).not.toHaveBeenCalledWith('#withdraw-confirmation');
        expect(notificationService.error).not.toHaveBeenCalled();
    });

    it('should check bitcoin address on confirm', function () {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets();
        $rootScope.$apply();

        controller.address = undefined;
        expect(controller.confirmWithdraw(formMock)).toBe(false);

        controller.address = '198ynwv8yq0wef';
        expect(controller.confirmWithdraw(formMock)).toBe(false);
    });

    it('should check bitcoin address in not a deposit one', function () {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets();
        $rootScope.$apply();

        controller.address = depositAddress;
        expect(controller.confirmWithdraw(formMock)).toBe(false);
    });

    it('should show a confirmation dialog on confirm withdraw', function () {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets();
        $rootScope.$apply();

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.002');
        controller.recipient = bitcoinAddress;
        controller.amount = '9.99';
        initWithdrawAddressMock();
        expect(controller.confirmWithdraw(formMock)).toBe(true);
        $rootScope.$apply();

        expect(controller.confirm.amount.value).toEqual('10');
        expect(controller.confirm.amount.currency).toEqual(Currency.BTC.displayName);
        expect(controller.confirm.fee.value).toEqual('0.002');
        expect(controller.confirm.fee.currency).toEqual(Currency.WAV.displayName);
        expect(controller.confirm.recipient).toEqual(bitcoinAddress);
        expect(controller.confirm.gatewayAddress).toEqual(gatewayAddress);
        expect(dialogService.open).toHaveBeenCalledWith('#withdraw-confirmation');
    });

    it('should handle errors on confirm withdraw', function () {
        initRateServiceMock();
        initDepositDetailsMock();
        initControllerAssets();
        $rootScope.$apply();

        var deferred = $q.defer();
        spyOn(coinomatService, 'getWithdrawDetails').and.returnValue(deferred.promise);
        spyOn(notificationService, 'error');

        var errorMessage = 'Failed to get tunnel';
        deferred.reject(new Error(errorMessage));

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.002');
        controller.recipient = bitcoinAddress;
        controller.amount = '9.99';

        expect(controller.confirmWithdraw(formMock)).toBe(true);
        $rootScope.$apply();

        expect(notificationService.error).toHaveBeenCalledWith(errorMessage);
        expect(dialogService.open).not.toHaveBeenCalledWith('#withdraw-confirmation');
        expect(controller.confirm.gatewayAddress).toEqual('');
    });
});
