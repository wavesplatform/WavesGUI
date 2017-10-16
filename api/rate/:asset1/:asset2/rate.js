const RATE_MAP = Object.create(null);

const generate = function (assetId1, assetId2, rate) {
    RATE_MAP[`${assetId1}-${assetId2}`] = rate;
    RATE_MAP[`${assetId2}-${assetId1}`] = 1 / rate;
};

const getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};


module.exports = function (req, res, { asset1, asset2 }, { connection, meta }) {

    const getRate = function (assetId1, assetId2) {
        if (assetId1 === assetId2) {
            return 1;
        }
        let rate = RATE_MAP[`${assetId1}-${assetId2}`];
        if (!rate) {
            const from = RATE_MAP[`${assetId1}-${meta.configurations[connection].assets.USD}`];
            const to = RATE_MAP[`${assetId2}-${meta.configurations[connection].assets.USD}`];
            rate = from / to;
        }
        return rate;
    };

    generate('WAVES', meta.configurations[connection].assets.USD, 5.11);
    generate(meta.configurations[connection].assets.BTC, meta.configurations[connection].assets.USD, 5210.35);
    generate(meta.configurations[connection].assets.ETH, meta.configurations[connection].assets.USD, 294.33);
    generate(meta.configurations[connection].assets.EUR, meta.configurations[connection].assets.USD, 1.17505);


    setTimeout(() => {
        res.end(JSON.stringify({
            date: Date.now(),
            rate: getRate(asset1, asset2)
        }));
    }, getRandomInt(900, 2500));
};
