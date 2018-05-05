(function () {
    'use strict';

    const config = function ($urlRouterProvider, $stateProvider, $locationProvider) {

        const tsUtils = require('ts-utils');

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
                if (WavesApp.isWeb()) {
                    const base = document.createElement('base');
                    base.href = '/';
                    document.head.appendChild(base);
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
                        lng: localStorage.getItem('lng') || AppConfig.getUserLang(),
                        debug: !WavesApp.isProduction(),
                        ns: WavesApp.modules.filter(tsUtils.notContains('app.templates')),
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
                            loadPath: 'https://locize.wvservices.com/{{projectId}}/{{version}}/{{lng}}/{{ns}}',
                            projectId: '30ffe655-de56-4196-b274-5edc3080c724',
                            apiKey: '5af41ced-a862-4947-a079-2c7999367925',
                            referenceLng: 'en'
                        }
                    });

                i18next.on('initialized', () => {
                    const localeData = WavesApp.getLocaleData().separators;

                    BigNumber.config({
                        ROUNDING_MODE: BigNumber.ROUND_DOWN,
                        FORMAT: tsUtils.merge(Object.create(null), BIG_NUMBER_FORMAT, {
                            groupSeparator: localeData.group,
                            decimalSeparator: localeData.decimal
                        })
                    });

                    i18next.on('languageChanged', () => {
                        const localeData = WavesApp.getLocaleData().separators;

                        BigNumber.config({
                            ROUNDING_MODE: BigNumber.ROUND_DOWN,
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
                                    AppConfig.getCtrlName(tsUtils.camelCase(item.id))
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

    config.$inject = ['$urlRouterProvider', '$stateProvider', '$locationProvider'];

    angular.module('app')
        .config(config);
})();
