{
    class PairDataService {

        constructor(waves, utils) {
            return class PairData {

                constructor(pairOfIds) {
                    const NO_DATA_STRING = '';

                    this.pairOfIds = pairOfIds;
                    this.amountAsset = {};
                    this.priceAsset = {};
                    this.pair = NO_DATA_STRING;
                    this.price = NO_DATA_STRING;
                    this.change = NO_DATA_STRING;
                    this.bigNumberVolume = new BigNumber(0);
                    this.volume = NO_DATA_STRING;
                    this.fullVolume = NO_DATA_STRING;

                    this.amountAndPriceRequest = Promise.resolve();
                    this.volumeRequest = Promise.resolve();


                    this._init();
                }

                /**
                 * @private
                 */
                _init() {
                    let resolveVolume = null;
                    this.volumeRequest = new Promise((resolve) => {
                        resolveVolume = resolve;
                    });

                    this.amountAndPriceRequest = (
                        ds.api.pairs.get(this.pairOfIds[0], this.pairOfIds[1])
                            .then((pair) => {
                                this.amountAsset = pair.amountAsset;
                                this.priceAsset = pair.priceAsset;
                                this.pair = `${this.amountAsset.displayName} / ${this.priceAsset.displayName}`;

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
                                    this.fullVolume = volume.isNaN() ? '' : volume.toString();
                                    resolveVolume();
                                }, resolveVolume);

                            }, resolveVolume)
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
                        ds.moneyFromTokens('1', amountAsset),
                        waves.utils.getRateApi(amountAsset, priceAsset)
                    ])
                        .then(([money, api]) => {
                            const price = api.exchange(money.getTokens());

                            return ds.moneyFromTokens(price, priceAsset)
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
                        waves.utils.getRate(pair.amountAsset, WavesApp.defaultAssets.WAVES)
                    ])
                        .then(([volume, rate]) => {
                            return new BigNumber(volume).times(rate);
                        }, () => {
                            return new BigNumber(0);
                        });
                }

                /**
                 * @param volume
                 * @returns {string}
                 * @private
                 */
                static _getVolumeString(volume) {
                    if (volume && volume.isNaN()) {
                        return '';
                    }
                    if (volume.gte(1000)) {
                        return utils.getNiceBigNumberTemplate(volume);
                    }

                    const volumeString = volume.toFixed();
                    if (volume.lt(0.0001) && volume.gt(0)) {
                        return `...${volumeString.substring(-4)}`;
                    }

                    return volumeString.substr(0, 5);
                }

            };
        }

    }

    PairDataService.$inject = ['waves', 'utils'];

    angular.module('app.dex').service('PairData', PairDataService);
}
