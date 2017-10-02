(function () {
    'use strict';

    const wallet = angular.module('app.wallet', [
        'app.wallet.assets',
        'app.wallet.portfolio'
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
            .state('main.wallet.portfolio', {
                url: '/portfolio',
                views: {
                    content: {
                        templateUrl: getTemplatePath('portfolio')
                    }
                }
            })
            .state('main.wallet.transactions', {
                url: '/transactions',
                views: {
                    content: {
                        templateUrl: getTemplatePath('transactions')
                    }
                }
            });

    };

    WalletConfig.$inject = ['$stateProvider'];

    wallet
        .config(WalletConfig);

})();
