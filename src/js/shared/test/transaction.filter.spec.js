describe('Transaction.Filter', function() {
    var filter, tx,
        account = {
            address: '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            keyPair: {
                public: 'FJuErRxhV9JaFUwcYLabFK5ENvDRfyJbRz8FeVfYpBLn',
                private: '9dXhQYWZ5468TRhksJqpGT6nUySENxXi9nsCZH9AefD1'
            }
        };

    // Initialization of the module before each test case
    beforeEach(module('waves.core'));
    beforeEach(module('app.shared'));
    beforeEach(module('app.ui'));

    beforeEach(angular.mock.module(function ($provide) {
        $provide.factory('applicationContext', function () {
            return {
                account: account,
                cache: {
                    assets: {}
                }
            };
        });
    }));

    // Injection of dependencies
    beforeEach(inject(function($filter) {
        filter = $filter;
        tx = {
            'type': 7,
            'id': 'GAiU1ijDSMAMuv5JVQQ98xK2J467CMs8dJQvvczAg66E',
            'sender': '3PJaDyprvekvPXPuAtxrapacuDJopgJRaU3',
            'senderPublicKey': '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
            'fee': 100000,
            'timestamp': 1492004044603,
            'signature': '3h6crk2dSMYhcmQ9mXfnRkS69SeqhSb3vTu9Qau9Ug6uuHBUgkfgxn5cqPEGcHYjVmF46FqStDB9DV7kMnoPQHg1',
            'order1': {
                'id': '98GoaoQTKbqQQiPi5KEZYHUeYndwKQtcm7qWAk1f85xa',
                'senderPublicKey': 'AmPvkyRoVzcQeeJ7dF3Uw4c7SKDCQ5mhji2mW4x9Dnq7',
                'matcherPublicKey': '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
                'assetPair': {
                    'amountAsset': null,
                    'priceAsset': '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS'
                },
                'orderType': 'buy',
                'price': 37785,
                'amount': 100000000,
                'timestamp': 1492004010908,
                'expiration': 1493732010908,
                'matcherFee': 300000,
                'signature': '5nfffbhebeyGyt1E4cK1L532usEsgWNoc3xNq4vrtdeSHwusTAxe8BJ8njvEXNMu4Pc3UiGVxqxpfeguXiGu1PCR'
            },
            'order2': {
                'id': '33wh7NnLpabatTXT3GfDCDdiPDS5Ve3wT6aJ5LghXm8G',
                'senderPublicKey': 'D7i1bhLoMdyVdrMdbHQRf7KckNfZPLBkSaiYpADvrUGN',
                'matcherPublicKey': '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
                'assetPair': {
                    'amountAsset': null,
                    'priceAsset': '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS'
                },
                'orderType': 'sell',
                'price': 37785,
                'amount': 100000000,
                'timestamp': 1492004044069,
                'expiration': 1493732044069,
                'matcherFee': 300000,
                'signature': '3pz583o5LDx3JaXoZASuXRK5aSEFtKwHB21q7KFsEsCaZgJs3NFPu4Ehk9441EfxK87FLz7eJSisr6w2yKyANEkV'
            },
            'price': 37785,
            'amount': 100000000,
            'buyMatcherFee': 450000,
            'sellMatcherFee': 790000
        };
    }));

    it('should calculate fee for an exchange transactions when I am a buyer', function () {
        tx.order1.senderPublicKey = account.keyPair.public;

        var filtered = filter('transaction')([tx])[0];

        expect(filtered.formatted.fee).toEqual('0.0045');
    });

    it('should calculate fee for an exchange transactions when I am a seller', function () {
        tx.order2.senderPublicKey = account.keyPair.public;

        var filtered = filter('transaction')([tx])[0];

        expect(filtered.formatted.fee).toEqual('0.0079');
    });

    it('should calculate fee for an exchange transactions when I am trading with myself', function () {
        tx.order1.senderPublicKey = account.keyPair.public;
        tx.order2.senderPublicKey = account.keyPair.public;

        var filtered = filter('transaction')([tx])[0];

        expect(filtered.formatted.fee).toEqual('0.0124');
    });
});
