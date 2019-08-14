(function () {
    'use strict';

    const origin = angular.module;
    angular.module = function (...args) {
        const [name] = args;
        const module = origin.call(angular, ...args);

        if (WavesApp.modules.indexOf(name) === -1) {
            WavesApp.modules.push(name);
            wrapAngularController(module);
            wrapAngularComponent(module);
            wrapAngularDirective(module);
        }

        return module;
    };

    function wrapAngularController(module) {
        const origin = module.controller;
        module.controller = function (name, $ctrl) {
            if (typeof $ctrl !== 'function') {
                throw new Error('Wrong code style!');
            }
            WavesApp.addController(name, $ctrl);
            return origin.call(this, name, wrapControllerParams($ctrl));
        };
    }

    function wrapAngularComponent(module) {
        const origin = module.component;
        module.component = function (name, $component) {
            $component.controller = wrapControllerParams($component.controller);
            return origin.call(this, name, $component);
        };
    }

    function wrapAngularDirective(module) {
        const origin = module.directive;
        module.directive = function (name, $directive) {
            $directive.controller = wrapControllerParams($directive.controller);
            return origin.call(this, name, $directive);
        };
    }


    function wrapControllerParams(controller) {

        let newController = controller;

        if (typeof controller === 'function') {
            const $inject = ['$element', '$compile', '$scope', ...(controller.$inject || [])];

            if ($inject.length > 3 && !controller.length) {
                throw new Error('Wrong code style!');
            }

            newController = function ($element, $compile, $scope, ...args) {

                const onError = () => {
                    $element.addClass('_internal-error');
                    // const content = $compile('<w-component-error></w-component-error>')($scope);
                    // $element.append(content);
                    return this;
                };

                try {
                    const instance = new controller(...args);
                    const originalPostLink = instance.$postLink;

                    $element.addClass($element.prop('tagName').toLowerCase().replace(/^w-/, ''));

                    if (originalPostLink) {
                        instance.$postLink = function (...args) {
                            try {
                                return originalPostLink.apply(instance, args);
                            } catch (e) {
                                return onError();
                            }
                        };
                    }

                    return instance;
                } catch (e) {
                    return onError();
                }
            };

            newController.$inject = $inject;
        }

        return newController;
    }

    angular.module('app', [
        'ngAnimate',
        'ngMaterial',
        'ui.router',
        'ui.router.state.events',

        'app.templates',
        'app.utils',
        'app.ui',
        'app.welcome',
        'app.signUp',
        'app.signIn',
        'app.create',
        'app.restore',
        'app.saveSeed',
        'app.desktop',
        'app.ledger',
        'app.keeper',
        'app.import',
        'app.wallet',
        'app.dex',
        'app.tokens',
        'app.unavailable',
        'app.stand'
    ]);
})();

/**
 * @typedef {function} $templateRequest
 * @param {string} path
 * @return Promise<string>
 */

/**
 * @typedef {function} $compile
 * @param {string} template
 * @return _$ICompileResult
 */

/**
 * @typedef {function} _$ICompileResult
 * @param {$rootScope.Scope} $scope
 * @return JQuery
 */

/**
 * @typedef {object} IWavesApp
 * @property {string} name
 * @property {object} oracles
 * @property {string} version
 * @property {string} type
 * @property {string} origin
 * @property {MobileDetect} device
 * @property {Object.<{separators: {group: string, decimal: string}}>} localize
 * @property {number} minAliasLength
 * @property {number} maxAliasLength
 * @property {number} MAX_URL_LENGTH
 * @property {string} bankRecipient
 * @property {number} maxAddressLength
 * @property {{count: number, timeType: 'day'}} matcherSignInterval
 * @property {BigNumber} maxCoinsCount
 * @property {typeof WavesApp.TRANSACTION_TYPES} TRANSACTION_TYPES
 * @property {typeof WavesApp.network} network
 * @property {typeof WavesApp.defaultAssets} defaultAssets
 * @property {Array<string>} ALWAYS_PINNED_ASSETS
 * @property {object} remappedAssetNames
 * @property {object} dex
 * @property {Array<string>} dex.resolutions
 * @property {string} dex.defaultResolution
 * @property {Array<string>} modules
 * @property {function():boolean} isWeb
 * @property {function():boolean} isDesktop
 * @property {function():boolean} isProduction
 * @property {boolean} usePostMessageStorage
 * @property {boolean} isMock
 * @property {Function} addController
 * @property {Function} getController
 * @property {function():{name: string, separators: {group: string, decimal: string}}} getLocaleData
 * @property {function(data: string): Promise<object>} parseJSON
 * @property {function(data: object, [a], [b]): string} stringifyJSON
 * @property {Tree} stateTree
 */
