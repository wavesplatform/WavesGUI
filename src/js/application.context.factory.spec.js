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

    it('should cache assets and update issued tokens count', function () {
        var unknownAssetId = '------T4pSjunDqpz6Q3bit4fJJN9PD4t8AK8JZVSa5u';
        var tx = [
            {
                'type': 2,
                'fee': 106151,
                'timestamp': 1474706165244,
                'signature': '5RbVW57WEnuSXyz2Ba5sFkjXkWWBnc81fGZq1Zpwoetk1JkWkufMTaMnukgGsahxmiwNCtsLuuPYDB5mzkBBt8Bk',
                'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
                'recipient': '3MtCKcpwnQvK2fiVWsKJAhVEpXuFFopDqeE',
                'amount': 723987
            },
            {
                'type': 3,
                'id': assetId,
                'sender': '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
                'assetId': assetId,
                'name': '4wHKwCUAGbpPVg3gk',
                'description': 'ziu6bcfZ1gm5fRDb9R79HUnHMoE',
                'quantity': 100000000,
                'decimals': 2,
                'reissuable': true,
                'fee': 100000000,
                'timestamp': 1479119236120,
                'signature': '2Tc7kQDPE2LnhtkuN4CPgFaMPcdP6wUAJPaWDnZ16HcCurezt8oJPyGwo7wDGF7r7TSeEgsQXDCqDC5Qqb9z6JUu'
            },
            {
                'type': 2,
                'fee': 59291,
                'timestamp': 1474706165774,
                'signature': '5fjGRrNS9wg1RzcWuQUddPNfhm72CGAHWFo6bHpD5bGf3iyjNiXWLwVxdjeiw2Hnmrki61FYM5VAgpyTHmMaxc2y',
                'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
                'recipient': '3MuTjWD6muPQ3nbSAPtYMkyKwJwSAzC8C2J',
                'amount': 237099
            },
            {
                'type': 5,
                'id': '7bTtoTrGQhfjKvQQ35cNVrFURCBfQXqEyEeZYYVkJKNx',
                'sender': '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
                'assetId': assetId,
                'quantity': 10000,
                'reissuable': false,
                'fee': 100000000,
                'timestamp': 1479308287927,
                'signature': '5vBwHfKRWXinQLgZUM6fsyJc6ikTjEyt4iDNNxDEhKx22RMp77eXVDsWCur3tbyzzKpvxu5uoseu5w9CUyaUUFxL'
            },
            {
                'type': 5,
                'id': '7bTtoTrGQhfjKvQQ35cNVrFURCBfQXqEyEeZYYVkJKNx',
                'sender': '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
                'assetId': assetId,
                'quantity': 5000,
                'reissuable': false,
                'fee': 100000000,
                'timestamp': 1479308287927,
                'signature': '5vBwHfKRWXinQLgZUM6fsyJc6ikTjEyt4iDNNxDEhKx22RMp77eXVDsWCur3tbyzzKpvxu5uoseu5w9CUyaUUFxL'
            },
            {
                'type': 5,
                'id': '7bTtoTrGQhfjKvQQ35cNVrFURCBfQXqEyEeZYYVkJKNx',
                'sender': '3MtMoVbAHSitzohEvd6dJGR3kmJZHSePUkS',
                'assetId': unknownAssetId,
                'quantity': 5000,
                'reissuable': false,
                'fee': 100000000,
                'timestamp': 1479308287927,
                'signature': '5vBwHfKRWXinQLgZUM6fsyJc6ikTjEyt4iDNNxDEhKx22RMp77eXVDsWCur3tbyzzKpvxu5uoseu5w9CUyaUUFxL'
            }
        ];

        context.cache.assets.grab(tx);

        expect(context.cache.assets[unknownAssetId]).toBeUndefined();
        expect(context.cache.assets[assetId].currency.precision).toEqual(2);
        expect(context.cache.assets[assetId].currency.id).toEqual(assetId);
        expect(context.cache.assets[assetId].totalTokens.toTokens()).toEqual(1000000 + 100 + 50);
    });

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

        context.cache.assets.put(tx);

        expect(context.cache.assets[assetId].balance.toTokens()).toEqual(0);
        expect(context.cache.assets[assetId].currency.id).toEqual(assetId);
        expect(context.cache.assets[assetId].currency.precision).toEqual(4);
        expect(context.cache.assets[assetId].reissuable).toBe(true);
    });

    it('should update the issue transaction in cache', function () {
        var currency = new Currency({
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
        context.cache.assets.put(tx);

        expect(context.cache.assets[assetId].balance.toTokens()).toEqual(10);
        expect(context.cache.assets[assetId].currency.id).toEqual(assetId);
        expect(context.cache.assets[assetId].currency.displayName).toEqual('Asset');
    });
});
