describe('Transaction.Loading.Service', function() {
    var transactionService,
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

    // Injection of dependencies
    beforeEach(inject(function($injector) {
        transactionService = $injector.get('transactionLoadingService');
    }));

    it('should merge transactions if confirmed and unconfirmed do not intersect', function () {
        var confirmed = [{
            'type': 2,
            'fee': 59291,
            'timestamp': 1474706165774,
            'signature': '5fjGRrNS9wg1RzcWuQUddPNfhm72CGAHWFo6bHpD5bGf3iyjNiXWLwVxdjeiw2Hnmrki61FYM5VAgpyTHmMaxc2y',
            'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MuTjWD6muPQ3nbSAPtYMkyKwJwSAzC8C2J',
            'amount': 237099
        },
        {
            'type': 2,
            'fee': 62391,
            'timestamp': 1474706165507,
            'signature': '4GQbncPm4HxNwcu6zKeVqxEHC6CK5jc99CjqwgtPNLgasebYBt3KCEf4QLrFeVAeDbekXN3RDRM3mzYxy69rmDWU',
            'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MuTjWD6muPQ3nbSAPtYMkyKwJwSAzC8C2J',
            'amount': 508442
        },
        {
            'type': 2,
            'fee': 106151,
            'timestamp': 1474706165244,
            'signature': '5RbVW57WEnuSXyz2Ba5sFkjXkWWBnc81fGZq1Zpwoetk1JkWkufMTaMnukgGsahxmiwNCtsLuuPYDB5mzkBBt8Bk',
            'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MtCKcpwnQvK2fiVWsKJAhVEpXuFFopDqeE',
            'amount': 723987
        }];

        var unconfirmed = [{
            'type': 2,
            'fee': 171965,
            'timestamp': 1474706164412,
            'signature': '44fHMbbNXz1zSiZnXEsRBwXbAScV6epM8jDsoDMtFAUSU7oN3vZPhxi5BPRjNyHqYfK8AFNeS4vQCvhiMcSxMJKT',
            'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MtCKcpwnQvK2fiVWsKJAhVEpXuFFopDqeE',
            'amount': 335693
        },
        {
            'type': 2,
            'fee': 187116,
            'timestamp': 1474706165157,
            'signature': '4p5KYrn2mCmMbsBfoU1FGjsDEgbMLhLzp95Dia9oco8Zdi3xRMUPdErQWqXGVXnQrqjnDwtDGbKP4AZsqrCKnX5a',
            'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MuTjWD6muPQ3nbSAPtYMkyKwJwSAzC8C2J',
            'amount': 276897
        }];

        var tx = transactionService.mergeTransactions(account, unconfirmed, confirmed);

        expect(tx.length).toEqual(5);
        _.each(confirmed, function (transaction) {
            expect(_.indexOf(tx, transaction)).toBeGreaterThan(-1);
        });
        _.each(unconfirmed, function (transaction) {
            expect(_.indexOf(tx, transaction)).toBeGreaterThan(-1);
        });
    });

    it('should merge transactions if confirmed and unconfirmed set intersect', function () {
        var confirmed = [{
            'type': 2,
            'fee': 59291,
            'timestamp': 1474706165774,
            'signature': '5fjGRrNS9wg1RzcWuQUddPNfhm72CGAHWFo6bHpD5bGf3iyjNiXWLwVxdjeiw2Hnmrki61FYM5VAgpyTHmMaxc2y',
            'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MuTjWD6muPQ3nbSAPtYMkyKwJwSAzC8C2J',
            'amount': 237099
        },
        {
            'type': 2,
            'fee': 106151,
            'timestamp': 1474706165244,
            'signature': '5RbVW57WEnuSXyz2Ba5sFkjXkWWBnc81fGZq1Zpwoetk1JkWkufMTaMnukgGsahxmiwNCtsLuuPYDB5mzkBBt8Bk',
            'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MtCKcpwnQvK2fiVWsKJAhVEpXuFFopDqeE',
            'amount': 723987
        }];

        var unconfirmed = [{
            'type': 2,
            'fee': 106151,
            'timestamp': 1474706165244,
            'signature': '5RbVW57WEnuSXyz2Ba5sFkjXkWWBnc81fGZq1Zpwoetk1JkWkufMTaMnukgGsahxmiwNCtsLuuPYDB5mzkBBt8Bk',
            'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MtCKcpwnQvK2fiVWsKJAhVEpXuFFopDqeE',
            'amount': 723987
        },
        {
            'type': 2,
            'fee': 187116,
            'timestamp': 1474706165157,
            'signature': '4p5KYrn2mCmMbsBfoU1FGjsDEgbMLhLzp95Dia9oco8Zdi3xRMUPdErQWqXGVXnQrqjnDwtDGbKP4AZsqrCKnX5a',
            'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MuTjWD6muPQ3nbSAPtYMkyKwJwSAzC8C2J',
            'amount': 276897
        }];

        var tx = transactionService.mergeTransactions(account, unconfirmed, confirmed);
        expect(tx.length).toEqual(3);
        expect(_.indexOf(tx, confirmed[0])).toBeGreaterThan(-1);
        expect(_.indexOf(tx, confirmed[1])).toEqual(-1);
        _.each(unconfirmed, function (transaction) {
            expect(_.indexOf(tx, transaction)).toBeGreaterThan(-1);
        });
    });

    it('should filter unconnfirmed transactions and then merge them', function () {
        var confirmed = [{
            'type': 2,
            'fee': 59291,
            'timestamp': 1474706165774,
            'signature': '5fjGRrNS9wg1RzcWuQUddPNfhm72CGAHWFo6bHpD5bGf3iyjNiXWLwVxdjeiw2Hnmrki61FYM5VAgpyTHmMaxc2y',
            'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MuTjWD6muPQ3nbSAPtYMkyKwJwSAzC8C2J',
            'amount': 237099
        },
        {
            'type': 2,
            'fee': 106151,
            'timestamp': 1474706165244,
            'signature': '5RbVW57WEnuSXyz2Ba5sFkjXkWWBnc81fGZq1Zpwoetk1JkWkufMTaMnukgGsahxmiwNCtsLuuPYDB5mzkBBt8Bk',
            'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MtCKcpwnQvK2fiVWsKJAhVEpXuFFopDqeE',
            'amount': 723987
        }];

        var unconfirmed = [{
            'type': 2,
            'fee': 106151,
            'timestamp': 1474706165244,
            'signature': '5RbVW57WEnuSXyz2Ba5sFkjXkWWBnc81fGZq1Zpwoetk1JkWkufMTaMnukgGsahxmiwNCtsLuuPYDB5mzkBBt8Bk',
            'sender': '3Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MtCKcpwnQvK2fiVWsKJAhVEpXuFFopDqeE',
            'amount': 723987
        },
        {
            'type': 2,
            'fee': 187116,
            'timestamp': 1474706165157,
            'signature': '4p5KYrn2mCmMbsBfoU1FGjsDEgbMLhLzp95Dia9oco8Zdi3xRMUPdErQWqXGVXnQrqjnDwtDGbKP4AZsqrCKnX5a',
            'sender': '9Mv61qe6egMSjRDZiiuvJDnf3Q1qW9tTZDB',
            'recipient': '3MuTjWD6muPQ3nbSAPtYMkyKwJwSAzC8C2J',
            'amount': 276897
        }];

        var tx = transactionService.mergeTransactions(account, unconfirmed, confirmed);
        expect(tx.length).toEqual(2);
        expect(_.indexOf(tx, confirmed[0])).toBeGreaterThan(-1);
        expect(_.indexOf(tx, confirmed[1])).toEqual(-1);
        expect(_.indexOf(tx, unconfirmed[0])).toBeGreaterThan(-1);
        expect(_.indexOf(tx, unconfirmed[1])).toEqual(-1);
    });
});
