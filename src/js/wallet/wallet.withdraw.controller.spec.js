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
            getWithdrawAddress: function () {}
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
        controller.getAmountForm = function () { return formMock; };
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
            xrate: 0.99,
            in_min: 0.1,
            in_max: 100,
            in_def: 10,
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
        spyOn(coinomatService, 'getWithdrawAddress').and.returnValue(deferred.promise);
        deferred.resolve(gatewayAddress);
    }

    it('should initialize properly', function () {
        expect(controller.address).toEqual('');
    });

    it('should request exchange rates on init', function () {
        initRateServiceMock();
        initControllerAssets();
        $rootScope.$apply();

        expect(coinomatService.getWithdrawRate).toHaveBeenCalled();
        expect(dialogService.open).toHaveBeenCalled();
        expect(controller.exchangeRate).toEqual(0.99);
        expect(controller.correction).toEqual(1000000);
        expect(controller.amount).toEqual(10);
        expect(controller.exchangeAmount).toEqual('9,900,000');
        expect(controller.validationOptions.rules.withdrawAmount.decimal).toEqual(Currency.BTC.precision);
        expect(controller.validationOptions.rules.withdrawAmount.min).toEqual(0.1);
        expect(controller.validationOptions.rules.withdrawAmount.max).toEqual(10);
    });

    it('should show a message if exchange rate request has failed', function () {
        var deferred = $q.defer();
        spyOn(coinomatService, 'getWithdrawRate').and.returnValue(deferred.promise);
        spyOn(notificationService, 'error');

        var errorMessage = 'Failed to get exchange rate';
        deferred.reject(new Error(errorMessage));

        initControllerAssets();
        $rootScope.$apply();

        expect(notificationService.error).toHaveBeenCalledWith(errorMessage);
        expect(dialogService.open).not.toHaveBeenCalled();
    });

    it('should check available balance on submit withdraw', function () {
        initRateServiceMock();
        initControllerAssets(undefined, Money.fromTokens(1, Currency.WAV));
        $rootScope.$apply();

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('1.001');
        spyOn(notificationService, 'error').and.returnValue(undefined);

        expect(controller.submitWithdraw()).toBe(false);
        timeout.flush();
        expect(dialogService.open).not.toHaveBeenCalledWith('#withdraw-address-dialog');
    });

    it('should not submit withdraw in case the form is invalid', function () {
        initRateServiceMock();
        initControllerAssets();
        $rootScope.$apply();

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('1.001');
        spyOn(notificationService, 'error').and.returnValue(undefined);
        spyOn(formMock, 'validate').and.returnValue(false);

        expect(controller.submitWithdraw()).toBe(false);
        timeout.flush();
        expect(dialogService.open).not.toHaveBeenCalledWith('#withdraw-address-dialog');
        expect(notificationService.error).not.toHaveBeenCalled();
    });

    it('should show withdraw address dialog on submit withdraw', function () {
        initRateServiceMock();
        initControllerAssets();
        $rootScope.$apply();

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.001');
        spyOn(notificationService, 'error').and.returnValue(undefined);

        expect(controller.submitWithdraw()).toBe(true);
        timeout.flush();
        expect(dialogService.open).toHaveBeenCalledWith('#withdraw-address-dialog');
        expect(notificationService.error).not.toHaveBeenCalled();
    });

    it('should check bitcoin address on confirm', function () {
        initRateServiceMock();
        initControllerAssets();
        $rootScope.$apply();

        controller.address = undefined;
        expect(controller.confirmWithdraw()).toBe(false);

        controller.address = '198ynwv8yq0wef';
        expect(controller.confirmWithdraw()).toBe(false);
    });

    it('should show a confirmation dialog on confirm withdraw', function () {
        initRateServiceMock();
        initControllerAssets();
        $rootScope.$apply();

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.002');
        controller.recipient = bitcoinAddress;
        controller.amount = '9.99';
        initWithdrawAddressMock();
        expect(controller.confirmWithdraw()).toBe(true);
        $rootScope.$apply();

        expect(controller.confirm.amount.value).toEqual('9.99');
        expect(controller.confirm.amount.currency).toEqual(Currency.BTC.displayName);
        expect(controller.confirm.fee.value).toEqual('0.002');
        expect(controller.confirm.fee.currency).toEqual(Currency.WAV.displayName);
        expect(controller.confirm.recipient).toEqual(bitcoinAddress);
        expect(controller.confirm.gatewayAddress).toEqual(gatewayAddress);
        expect(dialogService.open).toHaveBeenCalledWith('#withdraw-confirmation');
    });

    it('should handle errors on confirm withdraw', function () {
        initRateServiceMock();
        initControllerAssets();
        $rootScope.$apply();

        var deferred = $q.defer();
        spyOn(coinomatService, 'getWithdrawAddress').and.returnValue(deferred.promise);
        spyOn(notificationService, 'error');

        var errorMessage = 'Failed to get tunnel';
        deferred.reject(new Error(errorMessage));

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.002');
        controller.recipient = bitcoinAddress;
        controller.amount = '9.99';

        expect(controller.confirmWithdraw()).toBe(true);
        $rootScope.$apply();

        expect(notificationService.error).toHaveBeenCalledWith(errorMessage);
        expect(dialogService.open).not.toHaveBeenCalledWith('#withdraw-confirmation');
        expect(controller.confirm.gatewayAddress).toEqual('');
    });
});
