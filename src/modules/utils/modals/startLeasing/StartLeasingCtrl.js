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

        class StartLeasingCtrl extends Base {

            constructor() {
                super($scope);
                this.step = 0;
                /**
                 * @type {string}
                 */
                this.title = '';
                this.assetId = WavesApp.defaultAssets.WAVES;
                this.recipient = '';
                this.amount = new BigNumber(0);
                /**
                 * @type {string}
                 * @private
                 */
                this._transactionId = null;

                this.observe('step', this._onChangeStep);
                this._onChangeStep();

                waves.node.fee('lease')
                    .then(([money]) => {
                        this.fee = money;
                    });

                waves.node.assets.balance(this.assetId)
                    .then((info) => {
                        this.asset = info;
                    });
            }

            submit() {
                utils.whenAll([user.getSeed(), Waves.Money.fromTokens(this.amount, this.assetId)])
                    .then(([{ keyPair }, amount]) => waves.node.lease({
                        recipient: this.recipient,
                        keyPair: keyPair,
                        fee: this.fee,
                        amount
                    }))
                    .then((transaction) => {
                        this._transactionId = transaction.id;
                        this.step++;
                    });
            }

            _onChangeStep() {
                switch (this.step) {
                    case 0:
                    case 1:
                        this.title = i18n.translate('modal.startLease.title', 'app.utils');
                        break;
                    case 2:
                        this.title = i18n.translate('modal.startLease.titleComplete', 'app.utils');
                        break;
                    default:
                        throw new Error('Wrong step!');
                }
            }

        }

        return new StartLeasingCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils', 'waves', 'i18n'];

    angular.module('app.ui')
        .controller('StartLeasingCtrl', controller);
})();
