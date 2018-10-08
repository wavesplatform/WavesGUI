(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {User} user
     * @return {ReceiveBank}
     */
    const controller = function (Base, user) {

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

        }

        return new ReceiveBank();
    };

    controller.$inject = ['Base', 'user', '$scope', 'coinomatService'];

    angular.module('app.utils').component('wReceiveBank', {
        controller,
        bindings: {
            fiats: '<',
            asset: '<',
            singleAsset: '<',
            idNowUserLink: '<',
            listOfEligibleCountries: '<'
        },
        templateUrl: 'modules/utils/modals/receive/receiveBank/receive-bank.html',
        scope: false
    });

})();
