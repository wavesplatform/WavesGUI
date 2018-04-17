(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {ReadFile} readFile
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @return {MassSend}
     */
    const controller = function (Base, readFile, $scope, utils) {

        const Papa = require('papaparse');

        class MassSend extends Base {

            /**
             * @return {IMassSendTx}
             */
            get tx() {
                return this.state.massSend;
            }

            /**
             * @return {Money}
             */
            get totalAmount() {
                return this.tx.transfers.map(({ amount }) => amount).reduce((result, item) => result.add(item));
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
                /**
                 * @type {string}
                 */
                this.recipientCsv = '';
            }

            $postLink() {
                this.tx.transfers = this.tx.transfers || [];
                this._updateTextAreaContent();

                this.receive(utils.observe(this.state.massSend, 'transfers'), this._updateTextAreaContent, this);
            }

            /**
             * @param {File} file
             */
            importFile(file) {
                return readFile.read(file)
                    .then((content) => {
                        return Papa.parse(content);
                    }).then(({ data }) => {
                        const recipientHash = MassSend._getRecipientHashByCSVParseResult(data);
                        const transfers = [];
                        Object.keys(recipientHash).forEach((recipient) => {
                            const amountNum = recipientHash[recipient]
                                .map(MassSend._parseAmount)
                                .reduce((result, item) => result.add(item));
                            const amount = this.state.moneyHash[this.state.assetId].cloneWithTokens(amountNum);
                            transfers.push({ recipient, amount });
                        });
                        this.tx.transfers = transfers;
                        $scope.$digest();
                    });
            }

            _updateTextAreaContent() {
                const transfers = this.tx.transfers;
                const text = transfers.reduce((text, item, index) => {
                    const prefix = index !== 0 ? '\n' : '';
                    return `${text}${prefix}${item.recipient}, ${item.amount.toFormat()}`;
                }, '');
                if (text !== this.recipientCsv) {
                    this.recipientCsv = text;
                }
            }

            /**
             * @param {Array<Array<string>>} data
             * @return {Object.<string, Array<string>>}
             * @private
             */
            static _getRecipientHashByCSVParseResult(data) {
                const recipientHash = Object.create(null);
                data.forEach((item) => {
                    if (!item.length) {
                        return null;
                    }

                    const [recipient, amountString] = item;
                    if (!(recipient && amountString)) {
                        return null;
                    }

                    if (!recipientHash[recipient]) {
                        recipientHash[recipient] = [];
                    }

                    recipientHash[recipient].push(amountString);
                });
                return recipientHash;
            }

            /**
             * @param {string} amountString
             * @return {BigNumber}
             * @private
             */
            static _parseAmount(amountString) {
                try {
                    const amount = amountString
                        .replace(/\s/g, '')
                        .replace(/,/, '.');
                    return new BigNumber(amount);
                } catch (e) {
                    return new BigNumber(0);
                }
            }

        }

        return new MassSend();
    };

    controller.$inject = ['Base', 'readFile', '$scope', 'utils'];

    angular.module('app.ui').component('wMassSend', {
        bindings: {
            state: '<',
            onContinue: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/massSend/mass-send.html',
        transclude: true,
        controller
    });
})();
