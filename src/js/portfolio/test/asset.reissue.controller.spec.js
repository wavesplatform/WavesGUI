describe('Asset.Reissue.Controller', function() {
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

        controller = $controller('assetReissueController', {
            '$scope': scope,
            '$timeout': timeout,
            'constants.ui': $injector.get('constants.ui'),
            'portfolio.events': events,
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
                currency: assetBalance.currency,
                totalTokens: 0
            };
        }

        $rootScope.$broadcast(events.ASSET_REISSUE, {
            assetId: assetId,
            wavesBalance: wavesBalance
        });
    }

    it('should initialize correctly', function () {
        expect(controller.amount).toEqual('0');
        expect(controller.broadcast).toBeDefined();
    });

    it('should correctly handle the ASSET_REISSUE event', function () {
        initControllerAssets();

        expect(controller.assetId).toEqual(Currency.USD.id);
        expect(controller.validationOptions.rules.assetAmount.decimal).toEqual(2);
        expect(controller.validationOptions.rules.assetAmount.min).toEqual(0.01);
        expect(dialogService.open).toHaveBeenCalledWith('#asset-reissue-dialog');
    });

    it('should create transaction is all fields are valid', function () {
        initControllerAssets(Money.fromTokens(10, Currency.CNY));

        spyOn(controller.broadcast, 'setTransaction');

        controller.amount = '7';
        controller.reissuable = true;
        expect(controller.submitReissue(formMock)).toBe(true);

        timeout.flush();

        expect(controller.confirm.amount.toTokens()).toEqual(7);
        expect(controller.confirm.amount.currency).toEqual(Currency.CNY);
        expect(controller.confirm.fee.toTokens()).toEqual(1);
        expect(controller.confirm.fee.currency).toEqual(Currency.WAVES);

        expect(controller.broadcast.setTransaction).toHaveBeenCalled();
        expect(dialogService.open).toHaveBeenCalledTimes(2);
        expect(dialogService.open).toHaveBeenCalledWith('#asset-reissue-confirm-dialog');
    });

    it('should not create transaction if form is invalid', function () {
        initControllerAssets();

        spyOn(formMock, 'validate').and.returnValue(false);
        spyOn(controller.broadcast, 'setTransaction');

        controller.amount = '11';
        controller.reissuable = false;
        expect(controller.submitReissue(formMock)).toBe(false);
    });

    it('should not create transaction if there is not enough waves for fee', function () {
        initControllerAssets(undefined, Money.fromTokens(0.9, Currency.WAVES));

        spyOn(controller.broadcast, 'setTransaction');
        spyOn(notificationService, 'error');

        controller.amount = '10';
        controller.reissuable = true;
        expect(controller.submitReissue(formMock)).toBe(false);
        expect(notificationService.error).toHaveBeenCalled();
        expect(controller.broadcast.setTransaction).not.toHaveBeenCalled();
    });

    it('should not create transaction if there is not enough asset for transfer', function () {
        var waves = Money.fromTokens(10, Currency.WAVES);
        expect(function () {
            initControllerAssets(waves, waves);
        }).toThrowError(Error);
    });
});
