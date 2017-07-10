describe('Asset.Transfer.Controller', function() {
    var $rootScope, scope, timeout, events, dialogService, controller, formMock, notificationService,
        applicationContext = {
            account: {
                keyPair: {
                    public: 'FJuErRxhV9JaFUwcYLabFK5ENvDRfyJbRz8FeVfYpBLn',
                    private: '9dXhQYWZ5468TRhksJqpGT6nUySENxXi9nsCZH9AefD1'
                }
            },
            cache: {
                assets: {}
            }
        };
    var address = '3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq';

    // Initialization of the module before each test case
    beforeEach(module('waves.core'));
    beforeEach(module('app.portfolio'));

    // Injection of dependencies
    beforeEach(inject(function($injector, $controller, $timeout) {
        $rootScope = $injector.get('$rootScope');
        scope = $rootScope.$new();
        events = $injector.get('portfolio.events');
        dialogService = $injector.get('dialogService');
        notificationService = $injector.get('notificationService');
        timeout = $timeout;

        formMock = {
            invalid: function () {
                return {};
            },
            validate: function (options) {
                return true;
            }
        };

        spyOn(dialogService, 'open');

        controller = $controller('assetTransferController', {
            '$scope': scope,
            '$timeout': timeout,
            'constants.ui': $injector.get('constants.ui'),
            'portfolio.events': events,
            'autocomplete.fees': $injector.get('autocomplete.fees'),
            'apiService': $injector.get('apiService'),
            'dialogService': dialogService,
            'transactionBroadcast': $injector.get('transactionBroadcast'),
            'assetService': $injector.get('assetService'),
            'formattingService': $injector.get('formattingService'),
            'notificationService': notificationService,
            'applicationContext': applicationContext
        });
    }));

    function initControllerAssets(assetBalance, wavesBalance) {
        if (!assetBalance)
            assetBalance = Money.fromTokens(10, Currency.USD);

        if (!wavesBalance)
            wavesBalance = Money.fromTokens(20, Currency.WAVES);

        var assetId;
        if (assetBalance.currency !== Currency.WAVES) {
            assetId = assetBalance.currency.id;
            applicationContext.cache.assets[assetId] = {
                balance: assetBalance,
                currency: assetBalance.currency
            };
        }

        $rootScope.$broadcast(events.ASSET_TRANSFER, {
            assetId: assetId,
            wavesBalance: wavesBalance
        });
    }

    it('should initialize correctly', function () {
        expect(controller.recipient).toEqual('');
        expect(controller.amount).toEqual('0');
        expect(controller.confirm.amount.toTokens()).toEqual(0);
        expect(controller.confirm.fee.toTokens()).toEqual(0.001);
        expect(controller.confirm.recipient).toEqual('');
        expect(controller.autocomplete).toBeDefined();
        expect(controller.broadcast).toBeDefined();
    });

    it('should correctly handle the ASSET_TRANSFER event', function () {
        initControllerAssets();

        expect(controller.validationOptions.rules.assetAmount.decimal).toEqual(2);
        expect(controller.validationOptions.rules.assetAmount.min).toEqual(0.01);
        expect(controller.validationOptions.rules.assetAmount.max).toEqual(10);
        expect(dialogService.open).toHaveBeenCalledWith('#asset-transfer-dialog');
    });

    it('should create transaction is all fields are valid', function () {
        initControllerAssets(Money.fromTokens(10, Currency.CNY));

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.002');
        spyOn(controller.broadcast, 'setTransaction');

        controller.amount = '7';
        controller.recipient = '1W' + address;
        expect(controller.submitTransfer(formMock)).toBe(true);

        timeout.flush();

        expect(controller.confirm.amount.toTokens()).toEqual(7);
        expect(controller.confirm.amount.currency).toEqual(Currency.CNY);
        expect(controller.confirm.fee.toTokens()).toEqual(0.002);
        expect(controller.confirm.fee.currency).toEqual(Currency.WAVES);
        expect(controller.confirm.recipient).toEqual(address);

        expect(controller.broadcast.setTransaction).toHaveBeenCalled();
        expect(dialogService.open).toHaveBeenCalledTimes(2);
        expect(dialogService.open).toHaveBeenCalledWith('#transfer-asset-confirmation');
    });

    it('should not create transaction if form is invalid', function () {
        initControllerAssets();

        spyOn(formMock, 'validate').and.returnValue(false);
        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.002');
        spyOn(controller.broadcast, 'setTransaction');

        controller.amount = '11';
        controller.recipient = address;
        expect(controller.submitTransfer(formMock)).toBe(false);
    });

    it('should not create transaction if there is not enough waves for fee', function () {
        initControllerAssets();

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('20.002');
        spyOn(controller.broadcast, 'setTransaction');
        spyOn(notificationService, 'error');

        controller.amount = '10';
        controller.recipient = address;
        expect(controller.submitTransfer(formMock)).toBe(false);
        expect(notificationService.error).toHaveBeenCalled();
        expect(controller.broadcast.setTransaction).not.toHaveBeenCalled();
    });

    it('should not create transaction if there is not enough asset for transfer', function () {
        initControllerAssets();

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.002');
        spyOn(controller.broadcast, 'setTransaction');
        spyOn(notificationService, 'error');

        controller.amount = '10.01';
        controller.recipient = address;
        expect(controller.submitTransfer(formMock)).toBe(false);
        expect(notificationService.error).toHaveBeenCalled();
        expect(controller.broadcast.setTransaction).not.toHaveBeenCalled();
    });
});
