describe('Application.Context', function() {
    var context;
    var assetId = 'GAXAj8T4pSjunDqpz6Q3bit4fJJN9PD4t8AK8JZVSa5u';

    // Initialization of the module before each test case
    beforeEach(module('waves.core'));
    beforeEach(module('app.ui'));

    // Injection of dependencies
    beforeEach(inject(function($injector) {
        context = $injector.get('applicationContext');
    }));

    it('should put an issue transaction to cache', function () {
        var tx = {
            'type': 3,
            'id': assetId,
            'sender': '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
            'assetId': assetId,
            'name': 'Asset',
            'description': 'Description',
            'quantity': 100000000,
            'decimals': 4,
            'reissuable': true,
            'fee': 100000000,
            'timestamp': 1479119236120
        };

        expect(context.cache.assets[assetId]).toBeUndefined();

        context.cache.putAsset(tx);

        expect(context.cache.assets[assetId].balance.toTokens()).toEqual(0);
        expect(context.cache.assets[assetId].currency.id).toEqual(assetId);
        expect(context.cache.assets[assetId].currency.precision).toEqual(4);
    });

    it('should update the issue transaction in cache', function () {
        var currency = Currency.create({
            id: assetId,
            precision: 4
        });
        var tx = {
            'type': 3,
            'id': assetId,
            'sender': '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
            'assetId': assetId,
            'name': 'Asset',
            'description': 'Description',
            'quantity': 100000000,
            'decimals': 4,
            'reissuable': true,
            'fee': 100000000,
            'timestamp': 1479119236120
        };

        context.cache.assets[assetId] = {balance: Money.fromTokens(10, currency)};
        context.cache.putAsset(tx);

        expect(context.cache.assets[assetId].balance.toTokens()).toEqual(10);
        expect(context.cache.assets[assetId].currency.id).toEqual(assetId);
        expect(context.cache.assets[assetId].currency.displayName).toEqual('Asset');
    });
});
