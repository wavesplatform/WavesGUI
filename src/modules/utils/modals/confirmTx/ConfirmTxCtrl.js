(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {$mdDialog} $mdDialog
     * @returns {ConfirmTxCtrl}
     */
    const controller = function (Base, $scope, $mdDialog) {
        const analytics = require('@waves/event-sender');

        class ConfirmTxCtrl extends Base {

            /**
             * @type {boolean}
             * @private
             */
            _resolveOnClose = false;


            constructor({ signable, analyticsText }) {
                super($scope);
                this.signable = signable;
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

    controller.$inject = ['Base', '$scope', '$mdDialog'];

    angular.module('app.utils').controller('ConfirmTxCtrl', controller);
})();
