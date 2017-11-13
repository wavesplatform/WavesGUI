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

                const LOCAL_NUMBER_GROUP_SEPARATROS = {
                    en: ',',
                    ru: ' '
                };

                const BIG_NUMBER_FORMAT = {
                    decimalSeparator: '.',
                    groupSeparator: ',',
                    groupSize: 3,
                    secondaryGroupSize: 0,
                    fractionGroupSeparator: ' ',
                    fractionGroupSize: 0
                };

                i18next
                    .use(i18nextXHRBackend)
                    // .use(i18nextBrowserLanguageDetector) TODO Change lang detect. Author Tsigel at 03/11/2017 13:23
                    .init({
                        lng: 'en',
                        debug: true, // TODO remove for production
                        ns: WavesApp.modules.filter(tsUtils.notContains('app.templates')),
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
                                return `/modules/${path}/locales/${lng}.json`;
                            }
                        }
                    });

                i18next.on('initialized', () => {

                    BigNumber.config({
                        ROUNDING_MODE: BigNumber.ROUND_DOWN,
                        FORMAT: tsUtils.merge(Object.create(null), BIG_NUMBER_FORMAT, {
                            groupSeparator: LOCAL_NUMBER_GROUP_SEPARATROS[i18next.language]
                        })
                    });

                    i18next.on('languageChanged', () => {
                        BigNumber.config({
                            ROUNDING_MODE: BigNumber.ROUND_DOWN,
                            FORMAT: tsUtils.merge(Object.create(null), BIG_NUMBER_FORMAT, {
                                groupSeparator: LOCAL_NUMBER_GROUP_SEPARATROS[i18next.language]
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

                        const views = item.get('views').reduce((views, viewData) => {
                            const controller = (abstract || viewData.noController) ? undefined :
                                AppConfig.getCtrlName(tsUtils.camelCase(item.id));
                            const template = viewData.template;
                            const templateUrl = template ? undefined : (viewData.templateUrl ||
                                AppConfig.getTemplateUrl(WavesApp.stateTree.getPath(item.id)));
                            views[viewData.name] = { controller, template, templateUrl };

                            return views;
                        }, Object.create(null));

                        $stateProvider.state(WavesApp.stateTree.getPath(item.id).join('.'), {
                            abstract,
                            url,
                            redirectTo,
                            views
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
