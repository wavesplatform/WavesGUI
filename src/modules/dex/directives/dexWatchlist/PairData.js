{
    class PairDataService {

        constructor(waves, utils) {
            return class PairData {

                constructor(pairOfIds) {
                    this.pairOfIds = pairOfIds;
                    this.amountId = '';
                    this.priceId = '';
                    this.pair = '';
                    this.price = '';
                    this.change = '';
                    this.bigNumberVolume = new BigNumber(0);
                    this.volume = '';
                    this.fullVolume = '';

                    this.amountAndPriceRequest = Promise.resolve();
                    this.volumeRequest = Promise.resolve();


                    this._init();
                }

                _init() {
                    let resolveVolume = null;
                    this.volumeRequest = new Promise((resolve) => {
                        resolveVolume = resolve;
                    });

                    this.amountAndPriceRequest = (
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
                                    this.bigNumberVolume = volume;
                                    // todo: replace with discussed algorithm.
                                    this.volume = PairData._getVolumeString(volume);
                                    this.fullVolume = volume.toString();
                                    resolveVolume();
                                }, resolveVolume);

                            }, resolveVolume)
                    );
                }

                /**
                 * @param volume
                 * @returns {string}
                 * @private
                 */
                static _getVolumeString(volume) {
                    if (volume.gte(1000)) {
                        return utils.getNiceBigNumberTemplate(volume);
                    }

                    const volumeString = volume.toString();
                    if (volume.lt(0.0001) && volume.gt(0)) {
                        return `...${volumeString.substring(-4)}`;
                    }

                    return volumeString.substr(0, 5);
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
                    return Promise.all([
                        waves.utils.getVolume(pair),
                        waves.utils.getRate(pair.priceAsset, WavesApp.defaultAssets.WAVES)
                    ])
                        .then(([volume, rate]) => {
                            return new BigNumber(volume).mul(rate);
                        }, () => {
                            return new BigNumber(0);
                        });
                }

            };
        }

    }

    PairDataService.$inject = ['waves', 'utils'];

    angular.module('app.dex').service('PairData', PairDataService);
}
