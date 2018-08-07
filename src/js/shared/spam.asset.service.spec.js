describe('Spam.Asset.Service', function () {
    var service;

    // Initialization of the module before each test case
    beforeEach(module('app.shared'));

    // Injection of dependencies
    beforeEach(inject(function($injector) {
        service = $injector.get('spamAssetService');
    }));

    it('should parse content of community spam asset list', function () {
        var assetString = '2udT6qcXrYNdkwAqY8ZLGUJtL9UCno6bWsx5YoHpcnqo,Scam\n' +
            'J1yTiGyAd8eJHyZfP8DgNS8mdLgtNx7XFSTVrYPb3jn8,Scam\n' +
            'FL5GP3bHr5BuCrLGjvFGwkBJgny6JYfqwjg626HUEDZU,Scam\n' +
            'AM8mTdrytkFYHKuLSJRkoW27ak91pZKH6e9FLVvSCsEe,Scam\n' +
            'J9BFrBzftppntpaXcM1XvXVZAh57KYv9hJkDh5cu1Cwi,Scam\n' +
            '5sjbUm4XnKqTvZXg7YiCXMCv1C4DMpZHYEpKBPjj7N9R,Scam\n' +
            '4dtQEjtBEeQtn9UvUp8SbJfxn28QCFK9yyo76kzq6dRf,Scam\n' +
            '36WSpKD32i8UGv1Zsrtk2Q2iy3kKq2vwDypxvXmo4xkX,Scam\n' +
            'A2w8MWXaC65B8Hohc4c3nAuRGuXabsxpogfHFyzm1AjF,Scam\n' +
            'HVebepPof3vKwbr1LbYVd7oDZFWK37XzLjeQ9xkZka3t,Scam\n' +
            '2VejsfXiZMipddxfUJk8am5x8RaBJs8MSu7fBhRefciV,Scam\n' +
            'GMCTEsxAVpbN6Nfch47hEkTEDkbDS7Hztt9L53wv4FEr,Scam\n' +
            'HsspRGd6LAQNcKRSmNrxezn5y5z8mb2r8hJPzXajKYk1,Scam\n' +
            'Bc1E1gvmfHNunxUJu7KUw5QHpb7iUpJbPtdzSnoejpiU,Scam\n' +
            'D8WtEC7ZhE9MFtaHWDuYHCKgk5g4QbnJHrmMXcDJMA4i,Scam\n' +
            'EZA5TwraueJXAYtJkmAMC7ZLYMXtPtGu1wheysFLWok4,Scam\n' +
            'HuentKys2G44YqPX9uGQSoVkHFdfEKwhXXAKU8o3jned,Scam\n' +
            '7sXztNhcBzGpg5PY4nLMwyBh5tZL2Ld4Eenm9TFrTgm5,Scam\n' +
            'BFP4XuHU3UFiMf3dqE8Awvvry16N85JjG1mwdr3eC8wa,Scam\n' +
            'SgrQWEjtLZ9C8HiYT1UsygW9q3RyhxZ7n4b3Qjhmih7,Scam';

        var spamAssets = service.parseAssetList(assetString);

        /* jshint sub:true */
        expect(spamAssets['2udT6qcXrYNdkwAqY8ZLGUJtL9UCno6bWsx5YoHpcnqo']).toEqual(true);
        expect(spamAssets['HsspRGd6LAQNcKRSmNrxezn5y5z8mb2r8hJPzXajKYk1']).toEqual(true);
        expect(spamAssets['SgrQWEjtLZ9C8HiYT1UsygW9q3RyhxZ7n4b3Qjhmih7']).toEqual(true);
        expect(!!spamAssets['5qmdVL64UaHbzrVM5fGPQcMnznRuwpdyyuGPJ5hyZWRt']).toEqual(false);
        expect(!!spamAssets['2xUpPkiAbgwjCmohcM2bxc2bpzyF77wa1L61BwNcFpbP']).toEqual(false);
        expect(!!spamAssets['blahblah']).toEqual(false);
    });

    it('should detect spam assets from predefined list', function() {
        expect(service.isSpam('2udT6qcXrYNdkwAqY8ZLGUJtL9UCno6bWsx5YoHpcnqo')).toEqual(true);
        expect(service.isSpam('2xUpPkiAbgwjCmohcM2bxc2bpzyF77wa1L61BwNcFpbP')).toEqual(true);
        expect(service.isSpam('4uK8i4ThRGbehENwa6MxyLtxAjAo1Rj9fduborGExarC')).toEqual(false);
    });
});
