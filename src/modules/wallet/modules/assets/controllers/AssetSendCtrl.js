(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param {AssetsService} assetsService
     * @param {Base} Base
     * @param {Poll} Poll
     * @return {AssetSendCtrl}
     */
    const controller = function ($mdDialog, assetsService, Base, Poll) {

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

            _onChangeAmount() {
                this.aliasAmount = tsUtils.round(this.amount * 4, this.alias.precision);
            }

            _onChangeAlias() {
                this.amount = tsUtils.round(this.aliasAmount / 4, this.asset.precision);
            }

        }

        return new AssetSendCtrl(this.asset, this.alias);
    };

    controller.$inject = ['$mdDialog', 'assetsService', 'Base', 'Poll'];

    angular.module('app.wallet.assets')
        .controller('AssetSendCtrl', controller);
})();
