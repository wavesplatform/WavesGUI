(function () {
    'use strict';

    const controller = function (Base) {

        class MassSend extends Base {

            /**
             * @return {IMassSendTx}
             */
            get tx() {
                return this.state.massSend;
            }

            constructor() {
                super();
                /**
                 * @type {ISendState}
                 */
                this.state = null;
                /**
                 * @type {number}
                 */
                this.maxTransfersCount = 100;
                /**
                 * @type {Function}
                 */
                this.onContinue = null;
            }

            $postLink() {
                this.tx.transfers = this.tx.transfers || [];
            }

            /**
             * @param {File} file
             */
            importFile(file) {
                debugger;
            }

        }

        return new MassSend();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wMassSend', {
        bindings: {
            state: '<',
            onContinue: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/massSend/mass-send.html',
        transclude: false,
        controller
    });
})();
