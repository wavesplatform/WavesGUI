(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {app.utils} utils
     * @param {Waves} waves
     * @param {app.i18n} i18n
     * @return {StartLeasingCtrl}
     */
    const controller = function (Base, $scope, user, utils, waves, i18n) {

        const { SIGN_TYPE } = require('@waves/signature-adapter');
        const ds = require('data-service');
        const analytics = require('@waves/event-sender');

        class StartLeasingCtrl extends Base {

            /**
             * @type {args}
             */
            signPending = false;
            /**
             * @type {Array}
             * @private
             */
            _listeners = [];

            constructor() {
                super($scope);
                this.step = 0;
                /**
                 * @type {string}
                 */
                this.title = i18n.translate('modal.startLease.title', 'app.utils');
                this.assetId = WavesApp.defaultAssets.WAVES;
                this.recipient = '';
                this.amount = null;

                /**
                 * @type {string}
                 */
                this.nodeListLink = WavesApp.network.nodeList;

                waves.node.getFee({ type: SIGN_TYPE.LEASE })
                    .then((money) => {
                        this.fee = money;
                    });

                waves.node.assets.balance(this.assetId)
                    .then((balance) => {
                        this.balance = balance.available;
                    });

                const signPendingListener = $scope.$on('signPendingChange', (event, data) => {
                    this.signPending = data;
                });

                this._listeners.push(signPendingListener);
            }

            $onDestroy() {
                super.$onDestroy();
                this._listeners.forEach(listener => listener());
            }

            back() {
                this.step--;
            }

            sign() {
                analytics.send({ name: 'Leasing Popup Start Click', target: 'ui' });
                const tx = waves.node.transactions.createTransaction({
                    recipient: this.recipient,
                    fee: this.fee,
                    amount: this.amount,
                    type: SIGN_TYPE.LEASE
                });

                return ds.signature.getSignatureApi().makeSignable({
                    type: tx.type,
                    data: tx
                });
            }

            next(signable) {
                this.signable = signable;
                this.step++;
            }

        }

        return new StartLeasingCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils', 'waves', 'i18n', 'modalManager', '$mdDialog'];

    angular.module('app.ui')
        .controller('StartLeasingCtrl', controller);
})();
