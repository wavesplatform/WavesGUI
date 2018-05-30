{
    class PairDataService {

        constructor(waves) {
            return class PairData {

                constructor(pairOfIds) {
                    this.pairOfIds = pairOfIds;
                    this.amountId = '';
                    this.priceId = '';
                    this.pair = '';
                    this.price = '';
                    this.change = '';
                    this.volume = '';

                    this.request = Promise.resolve();

                    this._init();
                }

                _init() {
                    this.request = (
                        Waves.AssetPair.get(this.pairOfIds[0], this.pairOfIds[1])
                            .then((pair) => {
                                const amountAsset = pair.amountAsset;
                                this.amountId = amountAsset.id;

                                const priceAsset = pair.priceAsset;
                                this.priceId = priceAsset.id;

                                this.pair = `${amountAsset.displayName} / ${priceAsset.displayName}`;

                                this._getPriceData(pair).then((price) => {
                                    this.price = price;
                                });

                                PairData._getChange(pair).then((change) => {
                                    this.change = change.toFixed(2);
                                });

                                PairData._getVolume(pair).then((volume) => {
                                    // todo: replace with discussed algorithm.
                                    this.volume = volume.slice(0, 4);
                                });

                            })
                    );
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
