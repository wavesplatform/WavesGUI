(function () {
    'use strict';

    const { Money } = require('@waves/data-entities');

    const MIN_TOKEN_COUNT = 100;
    const MAX_TOKEN_COUNT = 50000;

    /**
     * @param {SingleSend} SingleSend
     * @param {$rootScope.Scope} $scope
     * @param {ConfigService} configService
     * @param {Waves} waves
     * @param {app.utils} utils
     */
    const controller = function (SingleSend, $scope, configService, waves, utils) {

        class BankSend extends SingleSend {

            /**
             * @return {boolean}
             */
            get isBankAccepted() {
                return !configService
                    .get('PERMISSIONS.CANT_TRANSFER_GATEWAY').includes(this.balance.asset.id);
            }

            /**
             * @return {boolean}
             */
            get isBankPendingOrError() {
                return this.termsLoadError || this.termsIsPending;
            }

            /**
             * @type {boolean}
             */
            termsIsPending = true;
            /**
             * @type {boolean}
             */
            termsLoadError = false;
            /**
             * @type {boolean}
             */
            termsAccepted = false;
            /**
             * @type {Money | null}
             */
            maxCoinomatAmount = null;
            /**
             * @type {Function}
             */
            onChangeMode = null;

            constructor(props) {
                super(props);
                this.wavesTx.recipient = WavesApp.bankRecipient;
            }

            $postLink() {
                const onHasMoneyHash = () => {
                    this.receive(utils.observe(this.tx, 'fee'), this._onChangeFee, this);
                    this.receive(utils.observe(this.tx, 'amount'), this._onChangeAmount, this);

                    this.receive(utils.observe(this.state, 'assetId'), this._onChangeAssetId, this);
                    this.receive(utils.observe(this.state, 'mirrorId'), this._onChangeMirrorId, this);

                    this.observe('mirror', this._onChangeAmountMirror);

                    this.receive(utils.observe(this.tx, 'amount'), this._updateWavesTxObject, this);
                    this.receive(utils.observe(this.tx, 'attachment'), this._updateWavesTxObject, this);

                    this._onChangeBaseAssets();
                    this._onChangeFee();
                    this._updateWavesTxObject();
                    this._setMinAndMaxAmount();
                    this._validateForm();
                };

                if (!this.state.moneyHash) {
                    this.receiveOnce(utils.observe(this.state, 'moneyHash'), onHasMoneyHash);
                } else {
                    onHasMoneyHash();
                }

                this.receive(utils.observe(this.state, 'moneyHash'), () => {
                    this._onChangeBaseAssets();
                    this._onChangeFee();
                    this._setMinAndMaxAmount();
                    this._validateForm();
                });

                $scope.$watch('$ctrl.bankSend.amount', () => this._validateForm());
            }

            setSendMode(mode) {
                this.onChangeMode({ mode });
            }

            createTx() {
                const attachmentString = this.tx.attachment ? this.tx.attachment.toString() : '';
                const tx = waves.node.transactions.createTransaction({
                    ...this.tx,
                    recipient: WavesApp.bankRecipient,
                    attachment: utils.stringToBytes(attachmentString),
                    amount: this.tx.amount
                });

                const signable = ds.signature.getSignatureApi().makeSignable({
                    type: tx.type,
                    data: tx
                });

                return signable;
            }

            /**
             * @private
             */
            _setMinAndMaxAmount() {
                const maxCoinomatAmount = this.balance.cloneWithTokens(MAX_TOKEN_COUNT);
                const minCoinomatAmount = this.balance.cloneWithTokens(MIN_TOKEN_COUNT);

                this.maxAmount = Money.min(maxCoinomatAmount, this.balance);
                this.minAmount = minCoinomatAmount;
                this.maxCoinomatAmount = maxCoinomatAmount;
            }

            /**
             * @private
             */
            _validateForm() {
                if (this.bankSend.amount && this.tx.amount.getTokens().gt(0)) {
                    this.bankSend.amount.$setTouched(true);
                }
            }

            /**
             * @private
             */
            _updateWavesTxObject() {
                const attachmentString = this.tx.attachment ? this.tx.attachment.toString() : '';
                this.wavesTx = {
                    ...this.wavesTx,
                    attachment: utils.stringToBytes(attachmentString),
                    amount: this.tx.amount,
                    assetId: this.assetId
                };
            }

            /**
             * @private
             */
            _onChangeAssetId() {
                super._onChangeAssetId();
                this._setMinAndMaxAmount();
                this._validateForm();
            }

        }

        return new BankSend($scope);
    };

    controller.$inject = [
        'SingleSend',
        '$scope',
        'configService',
        'waves',
        'utils'
    ];

    angular.module('app.ui').component('wBankSend', {
        bindings: {
            state: '<',
            onSign: '&',
            onChangeMode: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/singleSend/bankSend/bank-send.html',
        transclude: true,
        controller
    });
})();
