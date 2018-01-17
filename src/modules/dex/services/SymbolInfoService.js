(function () {
    'use strict';

    const DEFAULT_ASSETS_ID_LIST = [
        WavesApp.defaultAssets.WAVES,
        WavesApp.defaultAssets.BTC,
        WavesApp.defaultAssets.ETH,
        WavesApp.defaultAssets.USD,
        WavesApp.defaultAssets.EUR
    ];

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

            // search(userInput) {
            //     userInput = userInput.trim();
            //
            //     if (!userInput) {
            //         return Promise.resolve([]);
            //     } else {
            //         const [partOne, partTwo] = userInput.split('/');
            //
            //         if (!partTwo) {
            //             return waves.utils.searchAsset(partOne)
            //                 .then((list) => {
            //                     return list.filter((item) => {
            //                         return item.ticker || item.id === partOne;
            //                     });
            //                 })
            //                 .then((filteredList) => {
            //                     const pOne = filteredList[0];
            //                     const pTwoIdList = DEFAULT_ASSETS_ID_LIST.filter((id) => id !== pOne.id);
            //
            //                     return Promise.all(pTwoIdList.map((id) => {
            //                         return this._createSymbolInfo(pOne.id, id);
            //                     }));
            //                 });
            //         }
            //     }
            // }

            @decorators.cachable(1440) // TODO : make it persistent when cachable is limited in size
            _createSymbolInfo(assetOneId, assetTwoId) {
                return Waves.AssetPair.get(assetOneId, assetTwoId).then((pair) => {
                    const amount = pair.amountAsset;
                    const price = pair.priceAsset;

                    // TODO : remove when Waves.Asset is created via factory
                    return Promise.all([
                        waves.node.assets.info(amount.id),
                        waves.node.assets.info(price.id)
                    ]).then(([ amountInfo, priceInfo ]) => {
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
