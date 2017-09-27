(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param {AssetsService} assetsService
     * @param {Base} Base
     * @param {Poll} Poll
     * @param {app.utils} utils
     * @param {app.utils.decorators} decorators
     * @return {AssetSendCtrl}
     */
    const controller = function ($mdDialog, assetsService, Base, Poll, utils, decorators) {

        class AssetSendCtrl extends Base {

            constructor(asset, alias) {
                super();
                this.asset = asset;
                this.alias = alias;
                this.recepient = '';
                this.amount = 0;
                this.aliasAmount = 0;
                this.poll = new Poll(this._getAsset.bind(this), this._setAsset.bind(this), 1000);

                this.observe('amount', this._onChangeAmount);
                this.observe('aliasAmount', this._onChangeAlias);

                assetsService.getBalance(this.asset.id)
                    .then((data) => {
                        this.balance = data.balance;
                    });
            }

            $onDestroy() {
                super.$onDestroy();
                this.poll.destroy();
            }

            sendAll() {
                this.amount = this.asset.balance;
            }

            cancel() {
                $mdDialog.cancel();
            }

            onReadQrCode(result) {
                this.recepient = result;
            }

            _getAsset() {
                return assetsService.getBalance(this.asset.id);
            }

            _setAsset(asset) {
                this.asset = asset;
            }

            @decorators.cachable(1000)
            _getRate(amountId, aliasId) {
                return utils.when(4); // todo add request for get rate
            }

            _onChangeAmount() {
                this._getRate(this.asset.id, this.alias.id)
                    .then((rate) => {
                        this.aliasAmount = tsUtils.round(this.amount * rate, this.alias.precision);
                    });
            }

            _onChangeAlias() {
                this._getRate(this.asset.id, this.alias.id)
                    .then((rate) => {
                        this.amount = tsUtils.round(this.aliasAmount / rate, this.asset.precision);
                    });
            }

        }

        return new AssetSendCtrl(this.asset, this.alias);
    };

    controller.$inject = ['$mdDialog', 'assetsService', 'Base', 'Poll', 'utils', 'decorators'];

    angular.module('app.wallet.assets')
        .controller('AssetSendCtrl', controller);
})();
