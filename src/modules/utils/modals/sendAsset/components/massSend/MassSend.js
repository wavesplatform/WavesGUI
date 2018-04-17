(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {ReadFile} readFile
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {ValidateService} validateService
     * @param {Waves} waves
     * @return {MassSend}
     */
    const controller = function (Base, readFile, $scope, utils, validateService, waves) {

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
                const transfers = this.tx.transfers;
                if (transfers.length) {
                    return this.tx.transfers
                        .map(({ amount }) => amount)
                        .reduce((result, item) => result.add(item));
                }
                return this.state.moneyHash[this.state.assetId].cloneWithTokens('0');
            }

            get isValidCSV() {
                return this._isValidAmounts && this._isValidAllRecipients;
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
                /**
                 * @type {boolean}
                 * @private
                 */
                this._isValidAllRecipients = true;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._isValidAmounts = true;
                /**
                 * @type {Money}
                 * @private
                 */
                this._transferFee = null;
                /**
                 * @type {Money}
                 * @private
                 */
                this._massTransferFee = null;
            }

            $postLink() {
                Promise.all([
                    waves.node.getFee('transfer'),
                    waves.node.getFee('massTransfer')
                ]).then(([transferFee, massTransferFee]) => {
                    this._transferFee = transferFee;
                    this._massTransferFee = massTransferFee;

                    this.receive(utils.observe(this.state.massSend, 'transfers'), this._calculateFee, this);
                    this.receive(utils.observe(this.state.massSend, 'transfers'), this._updateTextAreaContent, this);
                    this.observe('recipientCsv', this._onChangeCSVText);

                    this.tx.transfers = this.tx.transfers || [];
                    this._calculateFee();
                    this._updateTextAreaContent();
                    this._validate();
                });
            }

            /**
             * @param {File} file
             */
            importFile(file) {
                return readFile.read(file)
                    .then((content) => {
                        this._processTextAreaContent(content);
                        $scope.$digest();
                    });
            }

            clear() {
                this.tx.transfers = [];
            }

            /**
             * @private
             */
            _calculateFee() {
                const fee = this._transferFee
                    .getTokens()
                    .add(this._massTransferFee
                        .getTokens()
                        .mul(this.tx.transfers.length)
                    );
                this.tx.fee = this._massTransferFee.cloneWithTokens(fee);
            }

            /**
             * @param {string} content
             * @private
             */
            _processTextAreaContent(content) {
                const { data } = Papa.parse(content);
                const recipientHash = MassSend._getRecipientHashByCSVParseResult(data);
                const transfers = [];
                Object.keys(recipientHash).forEach((recipient) => {
                    const amountNum = recipientHash[recipient]
                        .map(MassSend._parseAmount)
                        .reduce((result, item) => result.add(item));
                    const amount = this.state.moneyHash[this.state.assetId].cloneWithTokens(amountNum);
                    transfers.push({ recipient, amount });
                });
                if (MassSend._isNotEqual(this.tx.transfers, transfers)) {
                    this.tx.transfers = transfers;
                }
            }

            _validate() {
                this._validateAmounts();
                this._validateRecipients();
            }

            /**
             * @private
             */
            _validateRecipients() {
                Promise.all(this.tx.transfers.map(({ recipient }) => validateService.wavesAddress(recipient)))
                    .then(() => {
                        this._isValidAllRecipients = true;
                    })
                    .catch(() => {
                        this._isValidAllRecipients = false;
                    });
            }

            /**
             * @private
             */
            _validateAmounts() {
                const moneyHash = utils.groupMoney([this.totalAmount, this.tx.fee]);
                const balance = moneyHash[this.state.assetId];
                this._isValidAmounts = this.state.moneyHash[this.state.assetId].gte(balance);
            }

            /**
             * @private
             */
            _onChangeCSVText() {
                const text = this.recipientCsv;
                this._processTextAreaContent(text);
                this._validateRecipients();
                this._validateAmounts();
            }

            /**
             * @private
             */
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
             * @param {ITransferItem[]} a
             * @param {ITransferItem[]} b
             * @return {boolean}
             * @private
             */
            static _isNotEqual(a, b) {
                return !MassSend._isEqual(a, b);
            }

            /**
             * @param {ITransferItem[]} a
             * @param {ITransferItem[]} b
             * @return {boolean}
             * @private
             */
            static _isEqual(a, b) {
                return a.length === b.length && a.every((item, i) => {
                    return item.recipient === b[i].recipient && item.amount.eq(b[i].amount);
                });
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

    controller.$inject = ['Base', 'readFile', '$scope', 'utils', 'validateService', 'waves'];

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
