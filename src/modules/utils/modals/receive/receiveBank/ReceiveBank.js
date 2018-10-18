(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {User} user
     * @param {$rootScope.Scope} $scope
     * @param {GatewayService} gatewayService
     * @return {ReceiveBank}
     */
    const controller = function (Base, user, $scope, gatewayService) {

        class ReceiveBank extends Base {

            /**
             * @return {boolean}
             */
            get isLira() {
                return this.asset && this.asset.id === WavesApp.defaultAssets.TRY;
            }

            /**
             * @type {boolean}
             */
            pending = false;
            /**
             * @type {boolean}
             */
            isVerified = false;
            /**
             * @type {boolean}
             */
            isTermsAccepted = false;
            /**
             * @type {boolean}
             */
            singleAsset = true;
            /**
             * @type {Asset}
             */
            asset = null;
            /**
             * @type {string}
             */
            verifyLink = `https://go.idnow.de/coinomat/userdata/${user.address}`;
            /**
             * @type {Array}
             */
            fiats = [];
            /**
             * @type {boolean}
             */
            signInProgress = false;


            constructor() {
                super();

                this.observe('asset', this.initBankTab);
            }


            onSignStart() {
                this.signInProgress = true;
            }

            onSignEnd() {
                this.signInProgress = false;
            }

            initBankTab() {
                const sepaDetails = gatewayService.getSepaDetails(this.asset, user.address);
                if (sepaDetails) {

                    sepaDetails.then((details) => {
                        this.listOfEligibleCountries = details.listOfEligibleCountries;
                        this.idNowSiteUrl = details.idNowSiteUrl;
                        this.idNowUserLink = details.idNowUserLink;
                        $scope.$apply();
                    });
                }

            }

        }

        return new ReceiveBank();
    };

    controller.$inject = ['Base', 'user', '$scope', 'gatewayService'];

    angular.module('app.utils').component('wReceiveBank', {
        controller,
        bindings: {
            fiats: '<',
            asset: '<',
            singleAsset: '<',
            listOfEligibleCountries: '<'
        },
        templateUrl: 'modules/utils/modals/receive/receiveBank/receive-bank.html',
        scope: false
    });

})();
