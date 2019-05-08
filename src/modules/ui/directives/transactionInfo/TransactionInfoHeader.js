(function () {
    'use strict';

    const { SIGN_TYPE } = require('@waves/signature-adapter');

    /**
     * @param {app.utils} utils
     * @return {TransactionInfoHeader}
     */
    const controller = function (utils, user) {

        class TransactionInfoHeader {

            /**
             * @type {Signable}
             */
            signable;

            /**
             * @type {boolean}
             */
            isScam;

            /**
             * @type {boolean}
             */
            isScamAmount;

            /**
             * @type {boolean}
             */
            isScamPrice;

            $postLink() {
                const isOrder = this.signable.type === SIGN_TYPE.CREATE_ORDER;
                this.typeName = isOrder ? 'create-order' : utils.getTransactionTypeName(this.signable.getTxData());
                this.transaction = this.signable.getTxData();
                if (!this.transaction.assetId) {
                    this._addAssetId(this.transaction.type);
                }
                this.isScam = !!user.scam[this.transaction.assetId];
                if (this.transaction.type === 7) {
                    this.isScamAmount = !!user.scam[this.transaction.amount.asset];
                    this.isScamPrice = !!user.scam[this.transaction.price.asset];
                }
            }

            _addAssetId(typeName) {
                switch (typeName) {
                    case 4:
                    case 11:
                        this.transaction = {
                            ...this.transaction,
                            assetId: this.transaction.amount.asset.id
                        };
                        break;
                    case 14:
                        this.transaction = {
                            ...this.transaction,
                            assetId: this.transaction.minSponsoredAssetFee.asset.id
                        };
                        break;
                    default:
                        break;
                }

            }

        }

        return new TransactionInfoHeader();
    };

    controller.$inject = ['utils', 'user'];

    angular.module('app.ui').component('wTransactionInfoHeader', {
        bindings: {
            signable: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info-header.html',
        scope: false,
        controller
    });
})();
