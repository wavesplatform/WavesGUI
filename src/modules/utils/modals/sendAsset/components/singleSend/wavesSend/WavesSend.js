(function () {
    'use strict';

    const FIAT_ASSETS = {
        [WavesApp.defaultAssets.USD]: true,
        [WavesApp.defaultAssets.EUR]: true
    };

    const ds = require('data-service');

    /**
     * @param {SingleSend} SingleSend
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {User} user
     * @param {Waves} waves
     */
    const controller = function (SingleSend, $scope, utils, waves, user) {

        class WavesSend extends SingleSend {

            /**
             * @return {boolean}
             */
            get canSendToBank() {
                return FIAT_ASSETS[this.assetId] || false;
            }

            /**
             * @type {Function}
             */
            onChangeMode = null;

            $postLink() {
                this.receive(utils.observe(this.tx, 'recipient'), this.onChangeRecipient, this);

                const onHasMoneyHash = () => {
                    this.tx.amount = this.tx.amount || this.balance.cloneWithTokens('0');
                    this.receive(utils.observe(this.tx, 'fee'), this._onChangeFee, this);
                    this.receive(utils.observe(this.tx, 'amount'), this._onChangeAmount, this);

                    this.receive(utils.observe(this.state, 'assetId'), this._onChangeAssetId, this);
                    this.receive(utils.observe(this.state, 'mirrorId'), this._onChangeMirrorId, this);

                    this.observe('mirror', this._onChangeAmountMirror);

                    this.receive(utils.observe(this.tx, 'amount'), this._updateWavesTxObject, this);
                    this.receive(utils.observe(this.tx, 'recipient'), this._updateWavesTxObject, this);
                    this.receive(utils.observe(this.tx, 'attachment'), this._updateWavesTxObject, this);

                    this.onChangeRecipient();
                    this._onChangeFee();
                    this._setMinAndMaxAmount();
                    this._onChangeBaseAssets();
                    this._updateWavesTxObject();
                    this._fillMirror();
                };

                if (!this.state.moneyHash) {
                    this.receiveOnce(utils.observe(this.state, 'moneyHash'), onHasMoneyHash);
                } else {
                    onHasMoneyHash();
                }

                this.receive(utils.observe(this.state, 'moneyHash'), () => {
                    this._onChangeFee();
                    this._setMinAndMaxAmount();
                    this._onChangeBaseAssets();
                });

                $scope.$watch('$ctrl.wavesSend.amount', () => this._validateForm());
                $scope.$watch('$ctrl.wavesSend.recipient', () => {
                    if (this.tx.recipient) {
                        this.wavesSend.recipient.$$element.focus();
                    }
                });
            }

            setSendMode(mode) {
                this.onChangeMode({ mode });
            }

            /**
             * @return {Signable}
             */
            createTx() {
                const attachmentString = this.tx.attachment ? this.tx.attachment.toString() : '';
                const tx = waves.node.transactions.createTransaction({
                    ...this.tx,
                    attachment: utils.stringToBytes(attachmentString)
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
            _updateWavesTxObject() {
                const attachmentString = this.tx.attachment ? this.tx.attachment.toString() : '';
                const isWavesAddress = user.isValidAddress(this.tx.recipient);
                this.wavesTx = {
                    ...this.wavesTx,
                    recipient: isWavesAddress && this.tx.recipient || '',
                    attachment: utils.stringToBytes(attachmentString),
                    amount: this.tx.amount,
                    assetId: this.assetId
                };
            }

            /**
             * @private
             */
            _validateForm() {
                const amountGtZero = this.tx.amount && this.tx.amount.getTokens().gt(0);
                if (this.wavesSend.amount && (amountGtZero || this.tx.recipient)) {
                    this.wavesSend.amount.$setTouched(true);
                }
            }

            /**
             * @private
             */
            _setMinAndMaxAmount() {
                this.minAmount = this.balance.cloneWithTokens('0');
                this.maxAmount = this.balance;
            }

            /**
             * @private
             */
            _onChangeAssetId() {
                super._onChangeAssetId();
                this._setMinAndMaxAmount();
            }

        }

        return new WavesSend($scope);
    };

    controller.$inject = [
        'SingleSend',
        '$scope',
        'utils',
        'waves',
        'user'
    ];

    angular.module('app.ui').component('wWavesSend', {
        bindings: {
            state: '<',
            onSign: '&',
            onChangeMode: '&',
            onChangeRecipient: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/singleSend/wavesSend/waves-send.html',
        transclude: true,
        controller
    });
})();
