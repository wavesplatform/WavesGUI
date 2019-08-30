(function () {
    'use strict';

    const config = function ($urlRouterProvider, $stateProvider, $locationProvider, $compileProvider) {
        const TransportU2F = require('@ledgerhq/hw-transport-u2f');
        const tsUtils = require('ts-utils');
        const { BigNumber } = require('@waves/bignumber');
        const ds = require('data-service');
        const i18next = require('i18next');

        ds.config.setConfig(WavesApp.network);
        ds.config.set('remappedAssetNames', WavesApp.remappedAssetNames);
        ds.config.set('oracleTokenomica', WavesApp.oracles.tokenomica);

        class AppConfig {

            constructor() {
                this._initUrlResolveMode();
                this._initLocalize();
                this._initAdapters();
                this._initStates();
                this._initCompiler();
            }

            _initAdapters() {

                const Transport = window.TransportNodeHid || TransportU2F;

                ds.signAdapters.adapterList.forEach((Adapter) => Adapter.initOptions({
                    networkCode: WavesApp.network.code.charCodeAt(0),
                    openTimeout: WavesApp.sign.openTimeout,
                    listenTimeout: WavesApp.sign.listenTimeout,
                    exchangeTimeout: WavesApp.sign.exchangeTimeout,
                    debug: !WavesApp.isProduction(),
                    transport: Transport && Transport.default,
                    extension: () => typeof Waves === 'undefined' ? null : Waves
                }));
            }

            /**
             * @private
             */
            _initUrlResolveMode() {
                if (WavesApp.isWeb()) {
                    $locationProvider.html5Mode(true);
                }

                $urlRouterProvider.otherwise('/');
            }

            /**
             * @private
             */
            _initLocalize() {

                const BIG_NUMBER_FORMAT = {
                    decimalSeparator: '.',
                    groupSeparator: ',',
                    groupSize: 3,
                    secondaryGroupSize: 0,
                    fractionGroupSeparator: ' ',
                    fractionGroupSize: 0
                };

                i18next
                    .use(i18nextLocizeBackend)
                    .init({
                        lng: AppConfig.getUserLang(),
                        debug: !WavesApp.isProduction(),
                        ns: WavesApp.modules
                            .filter(
                                tsUtils.filterList(
                                    tsUtils.notContains('app.templates'),
                                    tsUtils.notContains('app.keeper'),
                                    tsUtils.notContains('app.wallet'),
                                    tsUtils.notContains('app.stand'),
                                    tsUtils.notContains('app.switch')
                                )
                            ),
                        fallbackLng: 'en',
                        whitelist: Object.keys(WavesApp.localize),
                        defaultNS: 'app',
                        useCookie: false,
                        useLocalStorage: false,
                        interpolation: {
                            format: function (value, format) {
                                switch (format) {
                                    case 'money':
                                        return value && value.getTokens().toFixed() || '';
                                    case 'money-currency':
                                        if (value) {
                                            return `${value.getTokens().toFixed()} ${value.asset.displayName}`;
                                        } else {
                                            return '';
                                        }
                                    case 'money-fee':
                                        return (
                                            value &&
                                            `${value.getTokens().toFixed()} ${value.asset.displayName}` ||
                                            ''
                                        );
                                    case 'BigNumber':
                                        return value && value.toFixed() || '';
                                    default:
                                        throw new Error('Wrong format type!');
                                }
                            }
                        },
                        backend: {
                            loadPath: `/locales/{{lng}}/{{ns}}.json?${WavesApp.version}`,
                            referenceLng: 'en'
                        }
                    });

                i18next.on('initialized', () => {
                    const localeData = WavesApp.getLocaleData().separators;

                    BigNumber.config.set({
                        ROUNDING_MODE: BigNumber.ROUND_MODE.ROUND_DOWN,
                        FORMAT: tsUtils.merge(Object.create(null), BIG_NUMBER_FORMAT, {
                            groupSeparator: localeData.group,
                            decimalSeparator: localeData.decimal
                        })
                    });

                    if (WavesApp.isDesktop()) {
                        transfer('setLanguage', i18next.language);
                    }

                    i18next.on('languageChanged', () => {
                        if (WavesApp.isDesktop()) {
                            transfer('setLanguage', i18next.language);
                        }

                        const localeData = WavesApp.getLocaleData().separators;

                        BigNumber.config.set({
                            ROUNDING_MODE: BigNumber.ROUND_MODE.ROUND_DOWN,
                            FORMAT: tsUtils.merge(Object.create(null), BIG_NUMBER_FORMAT, {
                                groupSeparator: localeData.group,
                                decimalSeparator: localeData.decimal
                            })
                        });
                    });
                });
            }

            /**
             * @private
             */
            _initStates() {

                const defaultUrl = AppConfig.getUrlFromState(WavesApp.stateTree.find('welcome'));
                $urlRouterProvider.when('', defaultUrl);

                WavesApp.stateTree.toArray()
                    .slice(1)
                    .forEach((item) => {
                        const abstract = item.get('abstract');
                        const url = AppConfig.getUrlFromState(item);
                        const redirectTo = item.get('redirectTo');
                        const reloadOnSearch = item.get('reloadOnSearch');

                        const views = item.get('views').reduce((views, viewData) => {
                            const controller = (
                                (abstract || viewData.noController) ?
                                    undefined :
                                    AppConfig.getCtrlName(item.get('controller') || tsUtils.camelCase(item.id))
                            );
                            const template = viewData.template;
                            const templateUrl = (
                                template ?
                                    undefined :
                                    (
                                        viewData.templateUrl ||
                                        AppConfig.getTemplateUrl(WavesApp.stateTree.getPath(item.id))
                                    )
                            );
                            views[viewData.name] = { controller, template, templateUrl };

                            return views;
                        }, Object.create(null));

                        $stateProvider.state(WavesApp.stateTree.getPath(item.id).join('.'), {
                            abstract,
                            url,
                            redirectTo,
                            views,
                            reloadOnSearch
                        });
                    });
            }

            /**
             * @private
             */
            _initCompiler() {
                $compileProvider.commentDirectivesEnabled(false);
                $compileProvider.cssClassDirectivesEnabled(false);
                $compileProvider.debugInfoEnabled(!WavesApp.isProduction());
            }

            static getCtrlName(name) {
                return `${name.charAt(0)
                    .toUpperCase() + name.substr(1)}Ctrl as $ctrl`;
            }

            static getTemplateUrl(path) {
                return path.filter((id) => !WavesApp.stateTree.find(id).get('abstract'))
                    .reduce((result, item, index, array) => {
                        item = tsUtils.camelCase(item);
                        if (index === array.length - 1) {
                            result += `/modules/${item}/templates/${item}.html`;
                        } else {
                            result += `/modules/${item}`;
                        }
                        return result;
                    }, '')
                    .replace(/\/\//g, '/')
                    .substr(1);
            }

            static getUserLang() {
                const available = Object.keys(WavesApp.localize);
                const langFromStorage = localStorage.getItem('lng');
                if (available.indexOf(langFromStorage) !== -1) {
                    return langFromStorage;
                }
                const cookieLng = Cookies.get('locale');
                const userLang = navigator.language || navigator.userLanguage;

                if (available.indexOf(cookieLng) !== -1) {
                    return cookieLng;
                }

                if (!userLang) {
                    return 'en';
                } else if (available.indexOf(userLang) !== -1) {
                    return userLang;
                } else {
                    let lng = null;
                    userLang.split(/\W/).some((part) => {
                        if (available.indexOf(part) !== -1) {
                            lng = part;
                        } else if (available.indexOf(part.toLowerCase()) !== -1) {
                            lng = part.toLowerCase();
                        }
                        return !!lng;
                    });

                    return lng || 'en';
                }
            }

            /**
             * @param {BaseTree} state
             */
            static getUrlFromState(state) {
                return state.get('abstract') ? undefined : state.get('url') || `/${state.id}`;
            }

        }

        return new AppConfig();
    };

    config.$inject = ['$urlRouterProvider', '$stateProvider', '$locationProvider', '$compileProvider'];

    angular.module('app')
        .config(config);
})();
