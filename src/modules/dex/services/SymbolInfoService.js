(function () {
    'use strict';

    const DEFAULT_SYMBOL_INFO = {
        session: '24x7',
        exchange: 'DEX',
        listed_exchange: 'DEX',
        timezone: 'Europe/London', // TODO

        minmov: 1,

        // TODO : check all that
        has_intraday: true,
        // intraday_multipliers: ['5'],
        supported_resolutions: WavesApp.dex.resolutions,
        has_seconds: false,
        // seconds_multipliers: ['5'],
        has_daily: false,
        has_weekly_and_monthly: false,
        has_empty_bars: true,
        force_session_rebuild: false,
        has_no_volume: false,
        data_status: 'pulsed'
    };

    /**
     * @param {Waves} waves
     * @param {app.utils.decorators} decorators
     * @return {SymbolInfoService}
     */
    const factory = function (waves, decorators) {

        class SymbolInfoService {

            get(symbolName) {
                const [partOne, partTwo] = symbolName.split('/');

                if (!partOne || !partTwo) {
                    return Promise.reject();
                } else {
                    return this._createSymbolInfo(partOne, partTwo);
                }
            }

            @decorators.cachable(1440) // TODO : make it persistent when cachable is limited in size
            _createSymbolInfo(assetOneId, assetTwoId) {
                return Waves.AssetPair.get(assetOneId, assetTwoId).then((pair) => {
                    const amount = pair.amountAsset;
                    const price = pair.priceAsset;

                    // TODO : remove when Waves.Asset is created via factory
                    return Promise.all([
                        waves.node.assets.getExtendedAsset(amount.id),
                        waves.node.assets.getExtendedAsset(price.id)
                    ]).then(([amountInfo, priceInfo]) => {
                        const amountName = amountInfo.ticker ? amountInfo.ticker : amountInfo.name;
                        const priceName = priceInfo.ticker ? priceInfo.ticker : priceInfo.name;

                        const ticker = `${amountInfo.id}/${priceInfo.id}`;
                        const symbolName = `${amountName}/${priceName}`;

                        return {
                            ...DEFAULT_SYMBOL_INFO,
                            pricescale: Math.pow(10, price.precision),
                            volume_precision: amount.precision,
                            description: symbolName,
                            name: symbolName,
                            ticker,
                            _wavesData: {
                                amountAsset: amountInfo,
                                priceAsset: priceInfo
                            }
                        };
                    });
                });
            }

        }

        return new SymbolInfoService();
    };

    factory.$inject = ['waves', 'decorators'];

    angular.module('app.dex').factory('symbolInfoService', factory);
})();
