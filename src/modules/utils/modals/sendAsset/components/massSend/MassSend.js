(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {ReadFile} readFile
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {ValidateService} validateService
     * @param {Waves} waves
     * @param {User} user
     * @param {app.utils.decorators} decorators
     * @return {MassSend}
     */
    const controller = function (Base, readFile, $scope, utils, validateService, waves, user, decorators) {

        const Papa = require('papaparse');
        const TYPE = WavesApp.TRANSACTION_TYPES.NODE.MASS_TRANSFER;

        class MassSend extends Base {

            /**
             * @return {IMassSendTx}
             */
            get tx() {
                return this.state.massSend;
            }

            /**
             * @type {number}
             */
            get validTxCount() {
                if (this.tx.transfers.length) {
                    const errors = utils.toHash(this.errors, 'recipient');
                    return this.tx.transfers.filter((data) => !errors[data.recipient]).length;
                } else {
                    return 0;
                }
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
                 * @type {Money}
                 */
                this.totalAmount = null;
                /**
                 * @type {Array<{recipient: string}>}
                 */
                this.errors = [];
                /**
                 * @type {Array<ITransferItem>}
                 */
                this.transfers = [];
                /**
                 * @type {MassSend.IView}
                 */
                this.view = utils.liteObject({
                    errors: utils.liteObject({ showAll: false })
                });
                /**
                 * @type {boolean}
                 */
                this.isValidAmounts = true;
                /**
                 * @type {form.FormController}
                 */
                this.massSend = null;
            }

            $postLink() {
                this.tx.transfers = this.tx.transfers || [];

                const onHasMoneyHash = () => {
                    const signal = utils.observe(this.state.massSend, 'transfers');

                    this.receive(utils.observe(this.state, 'assetId'), this._onChangeAssetId, this);

                    this.observe(['transfers', 'errors'], this._updateTxList);
                    this.observe('totalAmount', this._validate);
                    this.observe('transfers', this._updateTextAreaContent);
                    this.observe('recipientCsv', this._onChangeCSVText);
                    this.receive(signal, this._calculateTotalAmount, this);
                    this.receive(signal, this._validate, this);
                    this.receive(signal, this._calculateFee, this);

                    signal.dispatch();
                    this.transfers = this.tx.transfers.slice();
                    utils.observe(this, 'transfers').dispatch();
                };

                if (this.state.moneyHash) {
                    onHasMoneyHash();
                } else {
                    utils.observe(this.state, 'moneyHash').once(() => {
                        onHasMoneyHash();
                        $scope.$digest();
                    });
                }
            }

            /**
             * @param {ImportFile#IOnChangeOptions} data
             */
            importFile(data) {
                if (data.status === 'ok') {
                    return readFile.read(data.file)
                        .then((content) => {
                            this._processTextAreaContent(content);
                            this.massSend.recipientCsv.$touched = true;
                            $scope.$digest();
                        });
                } else {
                    // todo show import file error
                }
            }

            clear() {
                this.transfers = [];
                this.errors = [];
            }

            nextStep() {

                const tx = waves.node.transactions.createTransaction(TYPE, {
                    ...this.tx,
                    sender: user.address
                });

                this.onContinue({ tx });
            }

            /**
             * @private
             */
            _onChangeAssetId() {
                const transfers = this.transfers;
                if (transfers && transfers.length) {
                    const assetId = this.state.assetId;

                    this.clear();

                    this.transfers = transfers.map((item) => {
                        return {
                            recipient: item.recipient,
                            amount: this.state.moneyHash[assetId].cloneWithTokens(item.amount.toTokens())
                        };
                    });
                }
            }

            /**
             * @private
             */
            _updateTxList() {
                const list = this.transfers.slice();
                const errors = utils.toHash(this.errors, 'recipient');
                const validList = list.filter((item) => !errors[item.recipient]);

                if (MassSend._isNotEqual(this.tx.transfers, validList)) {
                    this.tx.transfers = validList;
                }
            }

            /**
             * @private
             */
            _calculateTotalAmount() {
                const transfers = this.tx.transfers;

                if (!transfers) {
                    this.totalAmount = null;
                }

                if (transfers.length) {
                    this.totalAmount = transfers
                        .map(({ amount }) => amount)
                        .reduce((result, item) => result.add(item));

                    return null;
                }

                this.totalAmount = this.state.moneyHash[this.state.assetId].cloneWithTokens('0');
            }

            /**
             * @private
             */
            @decorators.async()
            _calculateFee() {
                waves.node.getFee({ type: TYPE, tx: this.tx }).then((fee) => {
                    this.tx.fee = fee;
                    $scope.$digest();
                });
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
                        .map((amount) => {
                            try {
                                return MassSend._parseAmount(amount);
                            } catch (e) {
                                return new BigNumber(0);
                            }
                        })
                        .reduce((result, item) => result.add(item));
                    const amount = this.state.moneyHash[this.state.assetId].cloneWithTokens(amountNum);
                    transfers.push({ recipient, amount });
                });

                if (MassSend._isNotEqual(this.transfers, transfers)) {
                    this.transfers = transfers;
                }
            }

            /**
             * @private
             */
            _validate() {
                this._validateAmounts();
                this._validateRecipients();
            }

            /**
             * @private
             */
            @decorators.async()
            _validateRecipients() {

                Promise.all(this.transfers.map((item) => MassSend._isValidRecipient(item.recipient)))
                    .then((list) => {
                        const errors = [];

                        list.forEach((response, index) => {
                            const recipient = this.transfers[index].recipient;

                            if (!response.state) {
                                errors.push({ recipient });
                            }
                        });

                        if (errors.length) {
                            this.errors = errors;
                            $scope.$digest();
                        }
                    });
            }

            /**
             * @private
             */
            _validateAmounts() {
                const moneyHash = utils.groupMoney([this.totalAmount, this.tx.fee]);
                const balance = moneyHash[this.state.assetId];
                this.isValidAmounts = this.state.moneyHash[this.state.assetId].gte(balance) &&
                    this.totalAmount.getTokens().gt('0');
            }

            /**
             * @private
             */
            _onChangeCSVText() {
                const text = this.recipientCsv;
                this._processTextAreaContent(text);
            }

            /**
             * @private
             */
            _updateTextAreaContent() {
                const transfers = this.tx.transfers;
                const text = transfers.reduce((text, item, index) => {
                    const prefix = index !== 0 ? '\n' : '';
                    return `${text}${prefix}${item.recipient}, "${item.amount.toFormat()}"`;
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

                    const [recipient, amountString] = item.map((text) => text.replace(/\s/g, '').replace(/"/g, ''));
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
             * @param {string} recipient
             * @return Promise<boolean>
             * @private
             */
            @decorators.cachable(60)
            static _isValidRecipient(recipient) {
                return utils.resolve(validateService.wavesAddress(recipient));
            }

            /**
             * @param {string} amountString
             * @return {BigNumber}
             * @private
             */
            static _parseAmount(amountString) {
                const amount = amountString
                    .replace(/\s/g, '')
                    .replace(/,/, '.');
                return new BigNumber(amount);
            }

        }

        return new MassSend();
    };

    controller.$inject = ['Base', 'readFile', '$scope', 'utils', 'validateService', 'waves', 'user', 'decorators'];

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

/**
 * @name MassSend
 *
 * @typedef {object} MassSend#IView
 * @property {object} errors
 * @property {boolean} errors.showAll
 */
