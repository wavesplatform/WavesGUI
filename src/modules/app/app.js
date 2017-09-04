(function () {
    'use strict';

    const modules = [];

    const origin = angular.module;
    angular.module = function (...args) {
        const [name] = args;
        if (modules.indexOf(name) === -1) {
            modules.push(name);
        }
        return origin.call(angular, ...args);
    };

    const app = angular.module('app', [
        'ngMaterial',
        'ngMessages',
        'ui.router',
        'ui.router.state.events',

        'app.ui',
        'app.wallet',
        'app.welcome',
        'app.utils'
    ]);

    const AppConfig = function ($urlRouterProvider, $stateProvider, $locationProvider) {
        $locationProvider.html5Mode(true);

        i18next
            .use(i18nextXHRBackend)
            .use(i18nextBrowserLanguageDetector)
            .init({
                debug: true,
                lng: 'en',
                ns: modules,
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
                        const path = parts.length === 1 ? ns : parts.filter((item) => item !== 'app').join('/modules/');
                        return `modules/${path}/locales/${lng}.json`;
                    }
                }
            });

        const getState = function (name, diff) {
            const state = {
                url: `/${name}`,
                views: {
                    main: {
                        controller: `${name.charAt(0).toUpperCase() + name.substr(1)}Ctrl as $ctrl`,
                        templateUrl: `modules/${name}/templates/${name}.html`
                    }
                }
            };
            return tsUtils.merge(state, diff || Object.create(null));
        };

        $stateProvider
            .state('welcome', getState('welcome', { url: '/' }))
            .state('wallet', getState('wallet'));
    };

    AppConfig.$inject = [
        '$urlRouterProvider', '$stateProvider', '$locationProvider'
    ];

    const AppRun = function ($rootScope) {

        setTimeout(() => {
            const loader = $(document.querySelector('.app-loader'));
            loader.fadeOut(500, () => {
                loader.remove();
            });
        }, 300);

        const activeClasses = [];

        /**
         *
         * @param {Event} event
         * @param {Object} toState
         * @param {string} toState.name
         */
        const onChangeStateSuccess = (event, toState) => {
            activeClasses.forEach((className) => {
                document.body.classList.remove(className);
            });
            activeClasses.splice(0, 1, activeClasses.length);
            toState.name.split('.').filter(Boolean).forEach((className) => {
                const name = className.replace(/_/g, '-');
                document.body.classList.add(name);
                activeClasses.push(name);
            });
        };

        $rootScope.$on('$stateChangeSuccess', onChangeStateSuccess);

    };

    AppRun.$inject = ['$rootScope'];

    app.config(AppConfig);
    app.run(AppRun);
})();
