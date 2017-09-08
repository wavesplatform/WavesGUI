(function () {
    'use strict';

    const wallet = angular.module('app.wallet', [
        'app.wallet.assets',
        'app.wallet.exchange'
    ]);
    const getTemplatePath = function (name) {
        return `modules/wallet/modules/${name}/templates/${name}.html`;
    };

    const WalletConfig = function ($stateProvider) {

        $stateProvider
            .state('main.wallet.assets', {
                url: '/assets',
                views: {
                    content: {
                        templateUrl: getTemplatePath('assets'),
                        controller: 'AssetsCtrl as $ctrl'
                    }
                }
            })
            .state('main.wallet.exchange', {
                url: '/exchange',
                views: {
                    content: {
                        templateUrl: getTemplatePath('exchange')
                    }
                }
            })
            .state('main.wallet.transactions', {
                url: '/transactions',
                views: {
                    content: {
                        templateUrl: getTemplatePath('exchange')
                    }
                }
            });

    };

    WalletConfig.$inject = ['$stateProvider'];

    wallet
        .config(WalletConfig);

})();
