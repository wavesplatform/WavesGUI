(function () {
    'use strict';

    const ds = require('data-service');
    const { Asset } = require('@waves/data-entities');
    const { SIGN_TYPE } = require('@waves/signature-adapter');


    const factory = function (Base, waves, utils, $mdDialog, modalManager) {

        class ConfirmTxService extends Base {

            /**
             * @type {function}
             */
            onTxSent = null;
            /**
             * @type {number}
             */
            step = 0;
            /**
             * @type {string}
             */
            txId = '';
            /**
             * @type {Signable}
             */
            signable = null;
            /**
             * @type {boolean}
             */
            advancedMode = false;
            /**
             * @type {string}
             */
            activeTab = 'details';
            /**
             * @type {boolean}
             */
            canCreateLink = false;
            /**
             * @type {string}
             */
            exportLink = WavesApp.targetOrigin;
            /**
             * @type {string}
             */
            errorMessage = null;
            /**
             * @type {$rootScope.Scope}
             * @private
             */
            __$scope = null;


            constructor($scope) {
                super($scope);

                this.__$scope = $scope;

                this.syncSettings({
                    advancedMode: 'advancedMode'
                });

                this.observe('signable', this._onChangeSignable);
            }

            sendTransaction() {

                return this.signable.getDataForApi()
                    .then(ds.broadcast)
                    .then((data) => {
                        analytics.push(...this.getAnalytics(true));
                        return data;
                    }, (error) => {
                        analytics.push(...this.getAnalytics(false));
                        return Promise.reject(error);
                    });
            }

            getEventName() {
                return 'Transaction';
            }

            getAnalytics(success) {
                const NAME = this.getEventName();
                const amount = ConfirmTxService.toBigNumber(this.tx.amount);
                if (success) {
                    return [
                        NAME,
                        `${NAME}.${this.tx.type}.${WavesApp.type}`,
                        `${NAME}.${this.tx.type}.${WavesApp.type}.Success`,
                        amount
                    ];
                } else {
                    return [
                        NAME,
                        `${NAME}.${this.tx.type}.${WavesApp.type}`,
                        `${NAME}.${this.tx.type}.${WavesApp.type}.Error`,
                        amount
                    ];
                }
            }

            confirm() {
                return this.sendTransaction().then(tx => {

                    if (ConfirmTxService._isIssueTx(tx)) {
                        this._saveIssueAsset(tx);
                    }

                    this.step++;
                    this.onTxSent({ id: tx.id });
                    this.__$scope.$apply();
                }).catch((e) => {
                    this.errorMessage = e.message;
                    this.__$scope.$apply();
                });
            }

            showTxInfo() {
                this.signable.getId().then(id => {
                    $mdDialog.hide();
                    setTimeout(() => { // Timeout for routing (if modal has route)
                        modalManager.showTransactionInfo(id);
                    }, 1000);
                });
            }

            /**
             * @param tx
             * @private
             */
            _saveIssueAsset(tx) {
                waves.node.height().then(height => {
                    ds.assetStorage.save(tx.id, new Asset({
                        ...tx,
                        ticker: null,
                        precision: tx.decimals,
                        height
                    }));
                });
            }

            /**
             * @protected
             */
            initExportLink() {
                this.signable.getDataForApi().then(data => {
                    this.exportLink = `${WavesApp.targetOrigin}/#tx${utils.createQS(data)}`;
                    this.canCreateLink = this.exportLink.length <= WavesApp.MAX_URL_LENGTH;
                    this.__$scope.$apply();
                });
            }

            /**
             * @private
             */
            _onChangeSignable() {
                if (this.signable) {
                    if (this.advancedMode) {
                        this.signable.hasMySignature().then(state => {
                            if (state) {
                                this.initExportLink();
                            }
                        });
                    }
                    this.tx = waves.node.transactions.createTransaction(this.signable.getTxData());
                    this.signable.getId().then(id => {
                        this.txId = id;
                        this.__$scope.$digest();
                    });
                } else {
                    this.txId = '';
                    this.tx = null;
                }
            }

            /**
             * @param tx
             * @return {boolean}
             * @private
             */
            static _isIssueTx(tx) {
                return tx.type === SIGN_TYPE.ISSUE;
            }

            static toBigNumber(amount) {
                return amount && amount.getTokens().toFixed() || undefined;
            }

        }

        return ConfirmTxService;
    };

    factory.$inject = ['Base', 'waves', 'utils', '$mdDialog', 'modalManager'];

    angular.module('app.ui').factory('ConfirmTxService', factory);
})();
