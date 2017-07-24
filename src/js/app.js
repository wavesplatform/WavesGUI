(function () {
    'use strict';

    /**
     * Setup of main AngularJS application, with Restangular being defined as a dependency.
     *
     * @see controllers
     * @see services
     */

    let __mockShowError = _.identity;
    let __mockValidateAddress = _.identity;

    const app = angular.module(`app`, [
        `restangular`,
        `waves.core`,
        `ui.router`,

        `ngclipboard`,
        `ngAnimate`,
        `ngMaterial`,
        `ngValidate`,

        `app.state`,
        `app.ui`,
        `app.shared`,
        `app.login`,
        `app.navigation`,
        `app.wallet`,
        `app.tokens`,
        `app.dex`,
        `app.leasing`,
        `app.history`,
        `app.community`,
        `app.portfolio`
    ]);

    app.config(AngularApplicationConfig);
    app.run(AngularApplicationRun);

    function AngularApplicationConfig($provide, $compileProvider, $validatorProvider, $qProvider,
                                      $sceDelegateProvider, $mdAriaProvider, networkConstants, applicationConstants,
                                      $stateProvider, $urlRouterProvider, $locationProvider) {

        $locationProvider.html5Mode(true);

        $provide.constant(networkConstants,
            angular.extend(networkConstants, {
                NETWORK_NAME: WAVES_NETWORK_CONF.name,
                NETWORK_CODE: WAVES_NETWORK_CONF.code
            })
        );

        $provide.constant(applicationConstants,
            angular.extend(applicationConstants, {
                CLIENT_VERSION: WAVES_NETWORK_CONF.version,
                NODE_ADDRESS: WAVES_NETWORK_CONF.server,
                COINOMAT_ADDRESS: WAVES_NETWORK_CONF.coinomat,
                MATCHER_ADDRESS: WAVES_NETWORK_CONF.matcher,
                DATAFEED_ADDRESS: WAVES_NETWORK_CONF.datafeed
            })
        );

        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|file|chrome-extension):/);
        $qProvider.errorOnUnhandledRejections(false);

        $sceDelegateProvider.resourceUrlWhitelist([
            `self`,
            `https://test.coinomat.com/api/**`,
            `https://coinomat.com/api/**`,
            `http://marketdata.wavesplatform.com/**`,
            `https://marketdata.wavesplatform.com/**`
        ]);

        // Globally disables all ARIA warnings.
        $mdAriaProvider.disableWarnings();

        $validatorProvider.setDefaults({
            errorClass: `wInput-error`,
            onkeyup: false,
            showErrors: function (errorMap, errorList) {
                errorList.forEach((error) => {
                    // can't use notificationService here cos services are not available in config phase
                    __mockShowError(error.message);
                });

                let i, elements;
                for (i = 0, elements = this.validElements(); elements[i]; i++) {
                    angular.element(elements[i]).removeClass(this.settings.errorClass);
                }

                for (i = 0, elements = this.invalidElements(); elements[i]; i++) {
                    angular.element(elements[i]).addClass(this.settings.errorClass);
                }
            }
        });

        /* eslint-disable no-invalid-this, no-unused-expressions, prefer-arrow-callback */

        $validatorProvider.addMethod(`address`, function (value, element) {
            this.optional(element) || __mockValidateAddress(value);
        }, `Account number must be a sequence of 35 alphanumeric characters with no spaces, ` +
            `optionally starting with '1W'`);

        $validatorProvider.addMethod(`decimal`, function (value, element, maxDigits) {
            maxDigits = angular.isNumber(maxDigits) ? maxDigits : Currency.WAVES.precision;
            const regex = new RegExp(`^(?:-?\\d+)?(?:\\.\\d{0,${maxDigits}})?$`);
            return this.optional(element) || regex.test(value);
        }, `Amount is expected with a dot (.) as a decimal separator with no more than {0} fraction digits`);

        $validatorProvider.addMethod(`password`, function (value, element) {
            if (this.optional(element)) {
                return true;
            }

            const containsDigits = /[0-9]/.test(value);
            const containsUppercase = /[A-Z]/.test(value);
            const containsLowercase = /[a-z]/.test(value);

            return containsDigits && containsUppercase && containsLowercase;
        }, `The password is too weak. A good password must contain at least one digit, ` +
            `one uppercase and one lowercase letter`);

        $validatorProvider.addMethod(`minbytelength`, function (value, element, minLength) {
            if (this.optional(element)) {
                return true;
            }

            if (!angular.isNumber(minLength)) {
                throw new Error(`minbytelength parameter must be a number. Got ${minLength}`);
            }

            return converters.stringToByteArray(value).length >= minLength;
        }, `String is too short. Please add more characters.`);

        $validatorProvider.addMethod(`maxbytelength`, function (value, element, maxLength) {
            if (this.optional(element)) {
                return true;
            }

            if (!angular.isNumber(maxLength)) {
                throw new Error(`maxbytelength parameter must be a number. Got ${maxLength}`);
            }

            return converters.stringToByteArray(value).length <= maxLength;
        }, `String is too long. Please remove some characters.`);

        /* eslint-enable no-invalid-this, no-unused-expressions, prefer-arrow-callback */

        $urlRouterProvider
            .otherwise(`/wallet`);

        $stateProvider
            .state(`login`, {
                url: `/login`,
                views: {
                    main: {
                        templateUrl: `login/login`
                    }
                }
            })
            .state(`home`, {
                url: `/`,
                abstract: true,
                views: {
                    main: {
                        templateUrl: `core/core`
                    }
                }
            })
            .state(`home.wallet`, {
                url: `wallet`,
                views: {
                    content: {
                        templateUrl: `wallet/wallet`
                    }
                }
            })
            .state(`home.portfolio`, {
                url: `portfolio`,
                views: {
                    content: {
                        controller: `assetListController as $ctrl`,
                        templateUrl: `portfolio/portfolio`
                    }
                }
            })
            .state(`home.exchange`, {
                url: `exchange`,
                views: {
                    content: {
                        templateUrl: `dex/dex`
                    }
                }
            })
            .state(`home.leasing`, {
                url: `leasing`,
                views: {
                    content: {
                        templateUrl: `leasing/leasing`
                    }
                }
            })
            .state(`home.history`, {
                url: `history`,
                views: {
                    content: {
                        controller: `historyController as $ctrl`,
                        templateUrl: `history/history`
                    }
                }
            })
            .state(`home.tokens`, {
                url: `tokens`,
                views: {
                    content: {
                        templateUrl: `tokens/tokens`
                    }
                }
            })
            .state(`home.community`, {
                url: `community`,
                views: {
                    content: {
                        controller: `communityController as $ctrl`,
                        templateUrl: `community/community`
                    }
                }
            });

    }

    AngularApplicationConfig.$inject = [
        `$provide`, `$compileProvider`, `$validatorProvider`, `$qProvider`,
        `$sceDelegateProvider`, `$mdAriaProvider`, `constants.network`, `constants.application`,
        `$stateProvider`, `$urlRouterProvider`, `$locationProvider`
    ];

    function AngularApplicationRun(rest, applicationConstants, notificationService, addressService, $location, $state,
                                   loginContext) {

        const url = applicationConstants.NODE_ADDRESS;

        // restangular configuration
        rest.setDefaultHttpFields({
            timeout: 10000 // milliseconds
        });

        rest.setBaseUrl(url);

        // override mock methods cos in config phase services are not available yet
        __mockShowError = function (message) {
            notificationService.error(message);
        };

        __mockValidateAddress = function (address) {
            return addressService.validateAddress(address.trim());
        };

        const path = $location.path();
        const reloadUrl = $location.url();
        loginContext.login().then(() => {
            if (path !== `/` && path !== `/login`) {
                $location.url(reloadUrl);
            } else {
                $state.go(`home.wallet`);
            }
        });

    }

    AngularApplicationRun.$inject = [
        `Restangular`, `constants.application`, `notificationService`, `addressService`, `$location`, `$state`,
        `loginContext`
    ];

})();
