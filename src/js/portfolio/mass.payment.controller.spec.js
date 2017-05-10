describe('Mass.Payment.Controller', function() {
    var $rootScope, $window, scope, timeout, events, dialogService, controller, formMock, notificationService,
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
        $window = $injector.get('$window');
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

        controller = $controller('massPaymentController', {
            '$scope': scope,
            '$window': $window,
            '$timeout': timeout,
            'constants.ui': $injector.get('constants.ui'),
            'portfolio.events': events,
            'autocomplete.fees': $injector.get('autocomplete.fees'),
            'apiService': $injector.get('apiService'),
            'dialogService': dialogService,
            'transactionBroadcast': $injector.get('transactionBroadcast'),
            'assetService': $injector.get('assetService'),
            'notificationService': notificationService,
            'applicationContext': applicationContext
        });
    }));

    function initControllerAssets(assetBalance, wavesBalance) {
        if (!assetBalance)
            assetBalance = Money.fromTokens(1000, Currency.USD);

        if (!wavesBalance)
            wavesBalance = Money.fromTokens(20, Currency.WAVES);

        var assetId;
        if (assetBalance.currency !== Currency.WAVES) {
            assetId = assetBalance.currency.id;
            applicationContext.cache.assets[assetId] = {
                balance: assetBalance
            };
        }

        $rootScope.$broadcast(events.ASSET_MASSPAY, {
            assetId: assetId,
            wavesBalance: wavesBalance
        });
    }

    it('should initialize correctly', function () {
        expect(controller.stage).toEqual('loading');
        expect(controller.summary.totalAmount.toTokens()).toEqual(0);
        expect(controller.summary.totalFee.toTokens()).toEqual(0);
        expect(controller.confirm.amount.toTokens()).toEqual(0);
        expect(controller.confirm.fee.toTokens()).toEqual(0);
        expect(controller.confirm.recipients).toEqual(0);
        expect(controller.autocomplete).toBeDefined();
        expect(controller.broadcast).toBeDefined();
    });

    it('should correctly handle the MASS_PAY event', function () {
        initControllerAssets();

        expect(controller.sendingWaves).toBe(false);
        expect(dialogService.open).toHaveBeenCalledWith('#asset-mass-pay-dialog');
    });

    it('should understand that waves are being sent', function () {
        initControllerAssets(Money.fromTokens(10, Currency.WAVES), Money.fromTokens(10, Currency.WAVES));

        expect(controller.sendingWaves).toBe(true);

        expect(dialogService.open).toHaveBeenCalledWith('#asset-mass-pay-dialog');
    });

    it('should correctly parse JSON transaction file', function () {
        var content = '[' +
                '{' +
                    '"recipient": "3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq",' +
                    '"amount": 100' +
                '},' +
                '{' +
                    '"recipient": "3MuriKVs6CLgNxbhZ7SFRk1mfSJ2dRCK319",' +
                    '"amount": 0.00000001' +
                '}' +
            ']';

        spyOn(notificationService, 'error');

        controller.loadInputFile('test.json', content);

        expect(notificationService.error).not.toHaveBeenCalled();
        expect(controller.inputPayments.length).toEqual(2);
        expect(controller.inputPayments[0].recipient).toEqual('3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq');
        expect(controller.inputPayments[1].amount).toEqual(1e-8);
    });

    it('should correctly parse CSV transaction file', function () {
        var content = '3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq;300\n' +
            '3MuriKVs6CLgNxbhZ7SFRk1mfSJ2dRCK319;0.00000001\n' +
            '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS;zhmurik;000001';

        spyOn(notificationService, 'error');

        controller.loadInputFile('transactions.csv', content);
        expect(notificationService.error).not.toHaveBeenCalled();
        expect(controller.inputPayments.length).toEqual(3);
        expect(controller.inputPayments[0].recipient).toEqual('3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq');
        expect(controller.inputPayments[1].amount).toEqual(1e-8);
        expect(controller.inputPayments[2].recipient).toEqual('3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS');
        expect(controller.inputPayments[2].amount).toBeNaN();
        expect(controller.inputPayments[2].id).toEqual('000001');
    });

    it('should correctly parse CSV transaction file with empty lines', function () {
        var content = '3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq;300\n' +
            '\n' +
            '3MuriKVs6CLgNxbhZ7SFRk1mfSJ2dRCK319;0.00000001\n';

        spyOn(notificationService, 'error');

        controller.loadInputFile('transactions.csv', content);
        expect(notificationService.error).not.toHaveBeenCalled();
        expect(controller.inputPayments.length).toEqual(2);
        expect(controller.inputPayments[0].recipient).toEqual('3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq');
        expect(controller.inputPayments[1].amount).toEqual(1e-8);
        expect(controller.inputPayments[1].recipient).toEqual('3MuriKVs6CLgNxbhZ7SFRk1mfSJ2dRCK319');
    });

    it('should show error on unknown file format', function () {
        spyOn(notificationService, 'error');

        controller.loadInputFile('test.xls', '');

        expect(notificationService.error).toHaveBeenCalled();
        expect(controller.inputPayments.length).toEqual(0);
    });

    it('should not process empty input file', function () {
        spyOn(notificationService, 'error');

        controller.processInputFile(formMock);

        expect(notificationService.error).toHaveBeenCalled();
    });

    it('should not process file with non-parsed amount', function () {
        initControllerAssets();

        controller.inputPayments = [
            {
                recipient: '3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq',
                amount: 1000
            },
            {
                recipient: '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
                amount: NaN
            }
        ];

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.002');
        spyOn(controller.broadcast, 'setTransaction');

        controller.processInputFile(formMock);
        timeout.flush();

        expect(controller.broadcast.setTransaction).not.toHaveBeenCalled();
        expect(controller.invalidPayment).toBe(true);
        expect(controller.stage).toEqual('loading');
    });

    it('should not process file with too small amount', function () {
        initControllerAssets();

        controller.inputPayments = [
            {
                recipient: '3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq',
                amount: 1000
            },
            {
                recipient: '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
                amount: 0.0001
            }
        ];

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.002');
        spyOn(controller.broadcast, 'setTransaction');

        controller.processInputFile(formMock);
        timeout.flush();

        expect(controller.broadcast.setTransaction).not.toHaveBeenCalled();
        expect(controller.invalidPayment).toBe(true);
        expect(controller.stage).toEqual('loading');
    });

    it('should correctly sum up totals on processInputFile', function () {
        initControllerAssets();

        controller.inputPayments = [
            {
                recipient: '3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq',
                amount: 1000
            },
            {
                recipient: '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
                amount: 0.01
            }
        ];

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.002');
        spyOn(controller.broadcast, 'setTransaction');

        controller.processInputFile(formMock);
        timeout.flush();

        expect(controller.broadcast.setTransaction).toHaveBeenCalled();
        expect(controller.invalidPayment).toBeFalsy();
        expect(controller.stage).toEqual('processing');
        expect(controller.summary.totalTransactions).toEqual(2);
        expect(controller.summary.totalAmount.toTokens()).toEqual(1000.01);
        expect(controller.summary.totalFee.toTokens()).toEqual(0.004);
    });

    it('should not confirm payment if there is not enough Waves when paying USD', function () {
        initControllerAssets(Money.fromTokens(1000, Currency.USD), Money.fromTokens(0.00399, Currency.WAVES));

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.002');
        spyOn(controller.broadcast, 'setTransaction');
        spyOn(notificationService, 'error');

        controller.inputPayments = [
            {
                recipient: '3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq',
                amount: 1000
            },
            {
                recipient: '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
                amount: 0.01
            }
        ];

        controller.processInputFile(formMock);
        timeout.flush();

        expect(controller.submitPayment()).toBe(false);
        expect(controller.sendingWaves).toBeFalsy();
        expect(notificationService.error).toHaveBeenCalled();
    });

    it('should not confirm payment if there is not enough Waves when paying Waves', function () {
        var balance = Money.fromTokens(1000, Currency.WAVES);
        initControllerAssets(balance, balance);

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('1');
        spyOn(controller.broadcast, 'setTransaction');
        spyOn(notificationService, 'error');

        controller.inputPayments = [
            {
                recipient: '3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq',
                amount: 900
            },
            {
                recipient: '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
                amount: 99
            }
        ];

        controller.processInputFile(formMock);
        timeout.flush();

        expect(controller.submitPayment()).toBe(false);

        expect(controller.sendingWaves).toBe(true);
        expect(notificationService.error).toHaveBeenCalled();
    });

    it('should not confirm payment if there is not enough asset', function () {
        initControllerAssets();

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('1');
        spyOn(controller.broadcast, 'setTransaction');
        spyOn(notificationService, 'error');

        controller.inputPayments = [
            {
                recipient: '3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq',
                amount: 900
            },
            {
                recipient: '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
                amount: 100.01
            }
        ];

        controller.processInputFile(formMock);
        timeout.flush();

        expect(controller.submitPayment()).toBe(false);

        expect(controller.sendingWaves).toBe(false);
        expect(notificationService.error).toHaveBeenCalled();
    });

    it('should successfully submit payment is everything is ok', function () {
        initControllerAssets();

        spyOn(controller.autocomplete, 'getFeeAmount').and.returnValue('0.01');
        spyOn(controller.broadcast, 'setTransaction');
        spyOn(notificationService, 'error');
        spyOn(dialogService, 'close');

        controller.inputPayments = [
            {
                recipient: '3N9UuGeWuDt9NfWbC5oEACHyRoeEMApXAeq',
                amount: 900
            },
            {
                recipient: '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
                amount: 99
            }
        ];

        controller.processInputFile(formMock);
        timeout.flush();

        expect(controller.submitPayment()).toBe(true);
        timeout.flush();

        expect(controller.confirm.amount.toTokens()).toEqual(999);
        expect(controller.confirm.amount.currency).toEqual(Currency.USD);
        expect(controller.confirm.fee.toTokens()).toEqual(0.02);
        expect(controller.confirm.fee.currency).toEqual(Currency.WAVES);
        expect(controller.confirm.recipients).toEqual(2);

        expect(controller.sendingWaves).toBe(false);
        expect(notificationService.error).not.toHaveBeenCalled();
        expect(dialogService.open).toHaveBeenCalledWith('#asset-mass-pay-confirmation');
        expect(dialogService.close).toHaveBeenCalled();
    });
});
