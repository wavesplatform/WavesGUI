(function () {
    'use strict';

    const DEFAULT_LINK = '#';

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {GatewayService} gatewayService
     * @param {User} user
     * @return {ReceiveBank}
     */
    const controller = function (Base, $scope, gatewayService, user) {

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
            isSingleAsset;
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
            fiats = undefined;
            /**
             * @type {boolean}
             */
            signInProgress = false;
            /**
             * @type {string}
             */
            digiLiraUserLink = 'https://www.digilira.com/';

            /**
             * @type {string}
             */
            listOfEligibleCountries = DEFAULT_LINK;

            /**
             * @type {string}
             */
            idNowSiteUrl = DEFAULT_LINK;

            /**
             * @type {string}
             */
            idNowUserLink = DEFAULT_LINK;

            /**
             * @type {number}
             */
            step = 0;

            constructor() {
                super();

                this.observe('asset', this._updateDetails);
            }

            nextStep() {
                this.step += 1;
            }

            onSignStart() {
                this.signInProgress = true;
            }

            onSignEnd() {
                this.signInProgress = false;
            }

            /**
             * @private
             */
            _updateDetails() {
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

    controller.$inject = ['Base', '$scope', 'gatewayService', 'user'];

    angular.module('app.utils').component('wReceiveBank', {
        controller,
        bindings: {
            asset: '<',
            fiats: '<',
            isSingleAsset: '<'
        },
        templateUrl: 'modules/utils/modals/receive/receiveBank/receive-bank.html'
    });
})();
