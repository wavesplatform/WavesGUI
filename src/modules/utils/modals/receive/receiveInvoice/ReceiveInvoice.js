(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {Waves} waves
     * @param {User} user
     * @return {ReceiveInvoice}
     */
    const controller = function (Base, waves, user) {

        class ReceiveInvoice extends Base {

            /**
             * @type {Asset}
             */
            asset = null;

            /**
             * @type {Array}
             */
            invoicables = undefined;

            /**
             * @type {boolean}
             */
            isSingleAsset;

            /**
             * @type {Function}
             */
            onAssetChange;

            /**
             * @type {Array}
             */
            addressAndAliases = [
                user.address,
                ...waves.node.aliases.getAliasList()
            ];

            /**
             * @type {string}
             */
            chosenAssetId = null;

            /**
             * @type {string}
             */
            chosenAlias = null;

            /**
             * @type {Object}
             */
            invoiceAmount = null;

            /**
             * @type {string}
             */
            sendLink = '';

            constructor() {
                super();

                this.observe('chosenAssetId', ({ value: id }) => this.onAssetChange({ id }));

                this.observe(['asset', 'chosenAlias', 'invoiceAmount', 'invoicables'], this._updateSendLink);
            }

            /**
             * @private
             */
            _updateSendLink() {
                const assetId = this.asset && this.asset.id;

                if (!assetId || !this.chosenAlias) {
                    this.sendLink = '';

                    return;
                }

                const invoiceAmount = (this.invoiceAmount && this.invoiceAmount.toTokens()) || '0';
                const WAVES_URL = WavesApp.origin;

                this.sendLink = `${WAVES_URL}/#send/${assetId}?recipient=${this.chosenAlias}&amount=${invoiceAmount}`;
            }

        }

        return new ReceiveInvoice();
    };

    controller.$inject = ['Base', 'waves', 'user'];

    angular.module('app.utils').component('wReceiveInvoice', {
        controller,
        bindings: {
            asset: '<',
            invoicables: '<',
            isSingleAsset: '<',
            onAssetChange: '&'
        },
        templateUrl: 'modules/utils/modals/receive/receiveInvoice/receive-invoice.html'
    });
})();
