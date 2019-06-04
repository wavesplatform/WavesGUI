(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {app.utils} utils
     * @param {EventManager} eventManager
     * @param {User} user
     * @param {ConfigService} configService
     * @return {BaseNodeComponent}
     */
    const factory = function (Base, utils, eventManager, user, configService) {

        const ds = require('data-service');
        const { Money } = require('@waves/data-entities');
        const { currentFeeFactory, SIGN_TYPE } = require('@waves/signature-adapter');
        const { libs } = require('@waves/waves-transactions');
        const { address } = libs.crypto;
        const { path } = require('ramda');
        const { BigNumber } = require('@waves/bignumber');

        const MULTY_FEE_TRANSACTIONS = {
            [SIGN_TYPE.TRANSFER]: true
        };


        class BaseNodeComponent extends Base {

            get matcher() {
                return user.getSetting('network.matcher');
            }

            get node() {
                return user.getSetting('network.node');
            }


            /**
             * Get list of available fee for transaction
             * @param {*} tx
             * @return {Promise<Money[]>}
             * @protected
             */
            _feeList({ tx }) {
                const feeConfig = configService.getFeeConfig();
                const currentFee = currentFeeFactory(feeConfig);

                return this._fillTransaction(tx)
                    .then(tx => {

                        return Promise.all([
                            this._getAssets(tx)
                                .then(assetList => assetList.filter(asset => asset.hasScript))
                                .then(assetList => assetList.map(asset => asset.id)),
                            ds.signature.getSignatureApi().makeSignable({ type: tx.type, data: tx }).getBytes(),
                            ds.api.assets.get('WAVES'),
                            this._isSmartAccount(tx)
                        ]).then(([smartAssetsIdList, bytes, wavesAsset, hasScript]) => {
                            const bigNumberFee = currentFee(tx, bytes, hasScript, smartAssetsIdList);
                            const count = bigNumberFee
                                .div(feeConfig.calculate_fee_rules.default.fee)
                                .roundTo(0, BigNumber.ROUND_MODE.ROUND_UP);

                            const fee = new Money(bigNumberFee, wavesAsset);
                            const feeList = ds.utils.getTransferFeeList()
                                .map(money => money.cloneWithTokens(money.getTokens().mul(count)));

                            return MULTY_FEE_TRANSACTIONS[tx.type] ? [fee, ...feeList] : [fee];
                        });
                    });
            }

            /**
             * @param {*} tx
             * @param {Money} [fee]
             * @return {Promise<Money>}
             */
            getFee(tx, fee) {
                return this._feeList({ tx })
                    .then((list) => {
                        if (fee) {
                            const hash = utils.toHash(list, 'asset.id');
                            if (hash[fee.asset.id] && hash[fee.asset.id].getTokens().lte(fee.getTokens())) {
                                return fee;
                            } else {
                                throw new Error('Wrong fee!');
                            }
                        } else {
                            return list[0];
                        }
                    });
            }

            /**
             * @param {*} tx
             * @return {Promise<Money[]>}
             */
            getFeeList(tx) {
                return this._feeList({ tx });
            }

            /**
             * @param tx
             * @return {Promise<boolean>}
             * @private
             */
            _isSmartAccount(tx) {
                const publicKey = tx.senderPublicKey;

                if (!publicKey || user.publicKey === publicKey) {
                    return Promise.resolve(user.hasScript());
                }

                const wavesAddress = address({ publicKey }, WavesApp.network.code);

                return ds.api.address.getScriptInfo(wavesAddress)
                    .then(data => data.extraFee.getTokens().gt(0));
            }

            /**
             * Method for create transaction event for event manager
             * @param {Money[]} moneyList
             * @protected
             */
            _pipeTransaction(moneyList) {
                return (transaction) => {
                    eventManager.addTx(transaction, moneyList);
                    return transaction;
                };
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillTransaction(tx) {
                switch (tx.type) {
                    case SIGN_TYPE.ISSUE:
                        return this._fillIssue(tx);
                    case SIGN_TYPE.TRANSFER:
                        return this._fillTransfer(tx);
                    case SIGN_TYPE.REISSUE:
                        return this._fillReissue(tx);
                    case SIGN_TYPE.BURN:
                        return this._fillBurn(tx);
                    case SIGN_TYPE.LEASE:
                        return this._fillLease(tx);
                    case SIGN_TYPE.CANCEL_LEASING:
                        return this._fillCancelLease(tx);
                    case SIGN_TYPE.CREATE_ALIAS:
                        return this._fillCreateAlias(tx);
                    case SIGN_TYPE.MASS_TRANSFER:
                        return this._fillMassTransfer(tx);
                    case SIGN_TYPE.DATA:
                        return this._fillData(tx);
                    case SIGN_TYPE.SET_SCRIPT:
                        return this._fillSetScript(tx);
                    case SIGN_TYPE.SPONSORSHIP:
                        return this._fillSponsorship(tx);
                    case SIGN_TYPE.SET_ASSET_SCRIPT:
                        return this._fillSetAssetScript(tx);
                    default:
                        throw new Error(`Unsupported type ${tx.type}!`);
                }
            }

            /**
             * @param tx
             * @return {Promise<Array<Asset>>}
             * @private
             */
            _getAssets(tx) {
                return Promise.all(
                    [
                        ['amount'],
                        ['fee'],
                        ['assetId'],
                        ['transfers', 0, 'amount']
                    ].map(localPath => {
                        const value = path(localPath, tx);

                        if (value instanceof BigNumber) {
                            return null;
                        }

                        if (typeof value === 'string') {
                            return ds.api.assets.get(value)
                                .catch(() => ({ id: value, hasScript: false }));
                        }

                        if (value instanceof Money) {
                            return {
                                id: value.asset.id,
                                hasScript: value.asset.hasScript
                            };
                        }

                        return null;
                    }).filter(Boolean));
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillIssue(tx) {
                return ds.api.assets.get('WAVES').then(asset => ({
                    type: tx.type,
                    name: tx.name || 'name',
                    description: tx.description || 'description',
                    reissuable: tx.reissue || true,
                    quantity: tx.quantity || new BigNumber(1),
                    precision: tx.precision || 0,
                    script: tx.script || '',
                    fee: tx.fee || new Money(1, asset)
                }));
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillTransfer(tx) {
                return ds.api.assets.get('WAVES').then(asset => ({
                    type: tx.type,
                    recipient: tx.recipient || user.address,
                    amount: tx.amount || new Money(1, asset),
                    fee: tx.fee || new Money(1, asset),
                    attachment: tx.attachment instanceof Uint8Array ? Array.from(tx.attachment) : String(tx.attachment),
                    senderPublicKey: tx.senderPublicKey || user.publicKey
                }));
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillReissue(tx) {
                return ds.api.assets.get('WAVES').then(asset => ({
                    type: tx.type,
                    assetId: tx.assetId || WavesApp.defaultAssets.BTC,
                    reissuable: tx.reissue || true,
                    quantity: tx.quantity || new BigNumber(1),
                    fee: tx.fee || new Money(1, asset)
                }));
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillBurn(tx) {
                return ds.api.assets.get('WAVES').then(asset => ({
                    type: tx.type,
                    assetId: tx.assetId || WavesApp.defaultAssets.BTC,
                    amount: tx.amount || new BigNumber(1),
                    fee: tx.fee || new Money(1, asset)
                }));
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillLease(tx) {
                return ds.api.assets.get('WAVES').then(asset => ({
                    type: tx.type,
                    recipient: tx.recipient || user.address,
                    fee: tx.fee || new Money(1, asset),
                    amount: tx.amount || new Money(1, asset)
                }));
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillCancelLease(tx) {
                return ds.api.assets.get('WAVES').then(asset => ({
                    type: tx.type,
                    leaseId: tx.leaseId || WavesApp.defaultAssets.BTC,
                    fee: tx.fee || new Money(1, asset)
                }));
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillCreateAlias(tx) {
                return ds.api.assets.get('WAVES').then(asset => ({
                    type: tx.type,
                    alias: tx.alias || 'qwerty',
                    fee: tx.fee || new Money(1, asset)
                }));
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillMassTransfer(tx) {

                const transfers = tx.transfers && tx.transfers.length ? tx.transfers : null;

                const totalAmount = transfers && transfers.reduce((acc, item) => {
                    return acc.add(item.amount);
                }, tx.transfers[0].amount.cloneWithTokens(0)) || null;

                return ds.api.assets.get('WAVES').then(asset => ({
                    type: tx.type,
                    transfers: transfers || [{
                        amount: new Money(1, asset),
                        recipient: user.address
                    }],
                    totalAmount: totalAmount || new Money(1, asset),
                    fee: tx.fee || new Money(1, asset)
                }));
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillData(tx) {
                return ds.api.assets.get('WAVES').then(asset => ({
                    type: tx.type,
                    data: tx.data || [],
                    fee: tx.fee || new Money(1, asset)
                }));
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillSetScript(tx) {
                return ds.api.assets.get('WAVES').then(asset => ({
                    type: tx.type,
                    script: tx.script || '',
                    fee: tx.fee || new Money(1, asset)
                }));
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillSponsorship(tx) {
                return ds.api.assets.get('WAVES').then(asset => ({
                    type: tx.type,
                    assetId: tx.assetId || WavesApp.defaultAssets.BTC,
                    minSponsoredAssetFee: tx.minSponsoredAssetFee || new Money(1, asset),
                    fee: tx.fee || new Money(1, asset)
                }));
            }

            /**
             * @param tx
             * @return {*}
             * @private
             */
            _fillSetAssetScript(tx) {
                return ds.api.assets.get('WAVES').then(asset => ({
                    type: tx.type,
                    script: tx.script || 'base64:AQa3b8tH',
                    assetId: tx.assetId || WavesApp.defaultAssets.BTC,
                    fee: tx.fee || new Money(1, asset)
                }));
            }

        }

        return BaseNodeComponent;
    };

    factory.$inject = ['Base', 'utils', 'eventManager', 'user', 'configService'];

    angular.module('app')
        .factory('BaseNodeComponent', factory);
})();
