{
    angular.module('app').constant('sepaGateways', {
        // TODO : move this list to a server-size DB
        [WavesApp.defaultAssets.USD]: 'USD',
        [WavesApp.defaultAssets.EUR]: 'EUR',
        [WavesApp.defaultAssets.TRY]: 'TRY'
    });
}
