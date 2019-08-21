(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {ConfigService} configService
     * @param {Waves} waves
     */
    const controller = function (Base,
                                 configService) {

        class BankSend extends Base {

            /**
             * @return {string}
             */
            get assetId() {
                return this.state.assetId;
            }

            set assetId(id) {
                this.state.assetId = id;
            }

            /**
             * @return {Money}
             */
            get balance() {
                return this.moneyHash[this.assetId];
            }

            /**
             * @return {Object<string, Money>}
             */
            get moneyHash() {
                return this.state.moneyHash;
            }

            /**
             * @return {boolean}
             */
            get isBankAccepted() {
                return !configService
                    .get('PERMISSIONS.CANT_TRANSFER_GATEWAY').includes(this.balance.asset.id);
            }

            /**
             * @return {boolean}
             */
            get isBankPendingOrError() {
                return this.termsLoadError || this.termsIsPending;
            }

            /**
             * @type {boolean}
             */
            termsIsPending = true;
            /**
             * @type {boolean}
             */
            termsLoadError = false;
            /**
             * @type {boolean}
             */
            termsAccepted = false;

            // constructor() {
            // }

            setSendMode(mode) {
                this.onChangeMode({ mode });
            }

        }

        return new BankSend();
    };

    controller.$inject = ['Base', 'configService'];

    angular.module('app.ui').component('wBankSend', {
        bindings: {
            state: '<',
            onContinue: '&',
            onChangeMode: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/singleSend/bankSend/bank-send.html',
        transclude: true,
        controller
    });
})();
