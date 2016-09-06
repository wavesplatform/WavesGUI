describe('waves.money', function() {

    var rawAddress = '2n2MhfqjsXnjffZi8DcyziZikt7KRFufuMj';
    var displayAddress = '1W2n2MhfqjsXnjffZi8DcyziZikt7KRFufuMj';

    it('precisely converts tokens to coins', function () {
        expect(new Money(7e-6, Currency.WAV).toCoins()).toEqual(700);
        expect(Money.fromCoins(1000, Currency.WAV).toTokens()).toEqual(0.00001000);

        var v = 0.00001234;
        expect(Money.fromCoins(Money.fromTokens(v, Currency.WAV).toCoins(), Currency.WAV).toTokens()).toEqual(v);

        var stringValue = '0.001222222';
        var m = Money.fromTokens(stringValue, Currency.WAV);
        expect(m.toCoins()).toEqual(122222);
        expect(m.toTokens()).toEqual(0.00122222);
    });

    it('formats money values according to wallet design', function () {
        var m = new Money(88.9841, Currency.WAV);
        expect(m.formatAmount()).toEqual('88.98410000');
        expect(m.formatAmount(true)).toEqual('88.9841');
        expect(m.formatIntegerPart()).toEqual('88');
        expect(m.formatFractionPart()).toEqual('.98410000');
    });
});
