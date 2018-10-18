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

                    if (originalPostLink) {
                        instance.$postLink = function (...args) {
                            try {
                                return originalPostLink.apply(instance, args);
                            } catch (e) {
                                return onError(e);
                            }
                        };
                    }

                    return instance;
                } catch (e) {
                    return onError(e);
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
        'n3-line-chart',

        'app.templates',
        'app.utils',
        'app.ui',
        'app.welcome',
        'app.create',
        'app.restore',
        'app.desktop',
        'app.ledger',
        'app.import',
        'app.wallet',
        'app.dex',
        'app.tokens'
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
