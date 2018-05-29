{
    class PairDataService {

        constructor(waves) {
            return class PairData {

                constructor(pairOfIds) {
                    this.data = {
                        pairOfIds,
                        amountId: '',
                        priceId: '',
                        pair: '',
                        price: '',
                        change: '',
                        volume: ''
                    };

                    this._init();
                }

                _init() {
                    Waves.AssetPair.get(this.data.pairOfIds[0], this.data.pairOfIds[1])
                        .then((pair) => {
                            const amountAsset = pair.amountAsset;
                            this.data.amountId = amountAsset.id;

                            const priceAsset = pair.priceAsset;
                            this.data.priceId = priceAsset.id;

                            this.data.pair = `${amountAsset.displayName} / ${priceAsset.displayName}`;

                            this._getPriceData(pair).then((price) => {
                                this.data.price = price;
                            });

                            PairData._getChange(pair).then((change) => {
                                this.data.change = change.toFixed(2);
                            });

                            PairData._getVolume(pair).then((volume) => {
                                // todo: replace with discussed algorithm.
                                this.data.volume = volume.slice(0, 4);
                            });
                        });
                }

                /**
                 * @param pair
                 * @returns {Promise<string>}
                 * @private
                 */
                _getPriceData(pair) {
                    const { amountAsset, priceAsset } = pair;

                    return Promise.all([
                        Waves.Money.fromTokens('1', amountAsset),
                        waves.utils.getRateApi(amountAsset, priceAsset)
                    ])
                        .then(([money, api]) => {
                            const price = api.exchange(money.getTokens());

                            return Waves.Money.fromTokens(price, priceAsset)
                                .then((price = new BigNumber(0)) => {
                                    return price.toFormat(priceAsset.precision);
                                });
                        });
                }

                /**
                 * @param pair
                 * @returns {Promise<number>}
                 * @private
                 */
                static _getChange(pair) {
                    return waves.utils.getChange(pair.amountAsset.id, pair.priceAsset.id);
                }

                /**
                 * @param pair
                 * @returns {Promise<string>}
                 * @private
                 */
                static _getVolume(pair) {
                    return waves.utils.getVolume(pair);
                }

            };
        }

    }

    PairDataService.$inject = ['waves'];

    angular.module('app.dex').service('PairData', PairDataService);
}
