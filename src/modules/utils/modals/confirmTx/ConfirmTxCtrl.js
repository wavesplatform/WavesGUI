(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {$mdDialog} $mdDialog
     * @returns {ConfirmTxCtrl}
     */
    const controller = function (Base, $scope, $mdDialog, i18n) {

        const { SIGN_TYPE } = require('@waves/signature-adapter');
        const analytics = require('@waves/event-sender');

        class ConfirmTxCtrl extends Base {

            /**
             * @type {string}
             */
            title = '';
            /**
             * @type {boolean}
             * @private
             */
            _resolveOnClose = false;


            constructor({ signable, analyticsText }) {
                super($scope);
                this.signable = signable;
                if (this.signable.type === SIGN_TYPE.CANCEL_LEASING) {
                    this.title = i18n.translate('transaction.headers.cancel-leasing', 'app.utils');
                }
                if (analyticsText) {
                    analytics.send({ name: analyticsText, target: 'ui' });
                }
            }

            back() {
                $mdDialog.cancel();
            }

            close() {
                if (this._resolveOnClose) {
                    $mdDialog.hide();
                } else {
                    $mdDialog.cancel();
                }
            }

            onSendTransaction() {
                this._resolveOnClose = true;
            }

        }

        return new ConfirmTxCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog', 'i18n'];

    angular.module('app.utils').controller('ConfirmTxCtrl', controller);
})();
