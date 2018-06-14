{
    class PairData {

        constructor(waves, utils) {
            return class PairData {

                static id = 0;

                constructor(data) {

                    this.pairOfIds = [data.pair.amountAsset.id, data.pair.priceAsset.id];
                    this.amountAsset = data.pair.amountAsset;
                    this.priceAsset = data.pair.priceAsset;
                    this.pair = `${this.amountAsset.displayName} / ${this.priceAsset.displayName}`;
                    this.price = data.price;
                    this.change = data.change24;
                    this.volume = data.volume;
                    // this.volume = NO_DATA_STRING;
                    // this.fullVolume = NO_DATA_STRING;
                    this.uid = `pairs_${PairData.id++}`;
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

    PairData.$inject = ['waves', 'utils'];

    angular.module('app.dex').service('PairData', PairData);
}
