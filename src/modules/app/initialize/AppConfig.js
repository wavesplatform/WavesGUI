(function () {
    'use strict';

    const config = function ($urlRouterProvider, $stateProvider, $locationProvider) {

        class AppConfig {

            constructor() {
                this._initUrlResolveMode();
                this._initLocalize();
                this._initStates();
            }

            /**
             * @private
             */
            _initUrlResolveMode() {
                $locationProvider.html5Mode(true);
            }

            /**
             * @private
             */
            _initLocalize() {
                i18next
                    .use(i18nextXHRBackend)
                    .use(i18nextBrowserLanguageDetector)
                    .init({
                        debug: true, // TODO remove for production
                        ns: WavesApp.modules,
                        fallbackLng: 'en',
                        whitelist: ['en', 'ru'],
                        defaultNS: 'app',
                        useCookie: false,
                        useLocalStorage: false,
                        backend: {
                            loadPath: function (lng, ns) {
                                lng = lng[0];
                                ns = ns[0];
                                const parts = ns.split('.');
                                const path = parts.length === 1 ? ns : parts.filter((item) => item !== 'app')
                                    .join('/modules/');
                                return `modules/${path}/locales/${lng}.json`;
                            }
                        }
                    });
            }

            /**
             * @private
             */
            _initStates() {
                $stateProvider
                    .state('welcome', {
                        url: '/',
                        views: {
                            main: {
                                controller: AppConfig.getCtrlName('welcome'),
                                templateUrl: AppConfig.getTemplateUrl('welcome')
                            }
                        }
                    })
                    .state('main', {
                        abstract: true,
                        views: {
                            main: {
                                templateUrl: AppConfig.getTemplateUrl('app', 'main')
                            }
                        }
                    })
                    .state('main.wallet', {
                        url: '/wallet',
                        redirectTo: 'main.wallet.assets',
                        views: {
                            header: {
                                controller: AppConfig.getCtrlName('walletHeader'),
                                templateUrl: AppConfig.getTemplateUrl('wallet', 'header')
                            },
                            leftMenu: {
                                controller: AppConfig.getCtrlName('leftMenu'),
                                templateUrl: AppConfig.getTemplateUrl('app', 'leftMenu')
                            },
                            mainContent: {
                                template: '<ui-view name="content"></ui-view>'
                            }
                        }
                    })
                    .state('main.dex', {
                        url: '/dex',
                        views: {
                            header: {
                                controller: AppConfig.getCtrlName('dexHeader'),
                                templateUrl: AppConfig.getTemplateUrl('dex', 'header')
                            },
                            leftMenu: {
                                controller: AppConfig.getCtrlName('leftMenu'),
                                templateUrl: AppConfig.getTemplateUrl('app', 'leftMenu')
                            },
                            mainContent: {
                                controller: AppConfig.getCtrlName('dex'),
                                templateUrl: AppConfig.getTemplateUrl('dex', 'dex')
                            }
                        }
                    });
            }

            static getCtrlName(name) {
                return `${name.charAt(0)
                    .toUpperCase() + name.substr(1)}Ctrl as $ctrl`;
            }

            static getTemplateUrl(name, type) {
                return `modules/${name}/templates/${type || name}.html`;
            }

        }

        return new AppConfig();
    };

    config.$inject = ['$urlRouterProvider', '$stateProvider', '$locationProvider'];

    angular.module('app')
        .config(config);
})();
