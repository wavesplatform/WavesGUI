{
    angular.module('app').constant('gateways', {
        // TODO : move this list to a server-size DB
        [WavesApp.defaultAssets.BTC]: { waves: 'WBTC', gateway: 'BTC' },
        [WavesApp.defaultAssets.ETH]: { waves: 'WETH', gateway: 'ETH' },
        [WavesApp.defaultAssets.LTC]: { waves: 'WLTC', gateway: 'LTC' },
        [WavesApp.defaultAssets.ZEC]: { waves: 'WZEC', gateway: 'ZEC' },
        [WavesApp.defaultAssets.BCH]: { waves: 'WBCH', gateway: 'BCH' },
        [WavesApp.defaultAssets.DASH]: { waves: 'WDASH', gateway: 'DASH' },
        [WavesApp.defaultAssets.XMR]: { waves: 'WXMR', gateway: 'XMR' }
    });
}
