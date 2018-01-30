(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @returns {ConfirmGatewayTransaction}
     */
    const controller = function (Base, waves, user) {

        class ConfirmGatewayTransaction extends Base {

            constructor() {
                super();

                this.step = 0;
            }

            confirm() {
                return user.getSeed().then(({ keyPair }) => {
                    waves.node.assets.transfer({ ...this.tx, keyPair }).then(({ id }) => {
                        this.tx.id = id;
                        this.step++;
                        analytics.push('Gateway', 'Gateway.Send.Success', this.tx.amount);
                    }).catch((e) => {
                        console.error(e);
                        console.error('Gateway transaction error!');
                        analytics.push('Gateway', 'Gateway.Send.Error', this.tx.amount);
                    });
                });
            }

        }

        return new ConfirmGatewayTransaction();
    };

    controller.$inject = ['Base', 'waves', 'user'];

    angular.module('app.ui').component('wConfirmGatewayTransaction', {
        bindings: {
            targetRecipient: '@',
            tx: '<',
            gatewayDetails: '<',
            onClickBack: '&'
        },
        templateUrl: 'modules/ui/directives/confirmGatewayTransaction/confirmGatewayTransaction.html',
        transclude: false,
        controller
    });
})();
