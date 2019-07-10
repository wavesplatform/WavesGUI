(function () {
    'use strict';

    const ds = require('data-service');
    const { Asset } = require('@waves/data-entities');
    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const analytics = require('@waves/event-sender');

    const NO_EXPORT_TYPES = [
        SIGN_TYPE.MASS_TRANSFER,
        SIGN_TYPE.CREATE_ORDER,
        SIGN_TYPE.DATA,
        SIGN_TYPE.SCRIPT_INVOCATION
    ];

    const ANALYTICS_TX_NAMES = {
        [SIGN_TYPE.CREATE_ORDER]: 'Create order',
        [SIGN_TYPE.ISSUE]: 'Token Generation',
        [SIGN_TYPE.TRANSFER]: 'Transfer',
        [SIGN_TYPE.REISSUE]: 'Reissue Token',
        [SIGN_TYPE.BURN]: 'Burn Token',
        [SIGN_TYPE.EXCHANGE]: 'Exchange',
        [SIGN_TYPE.LEASE]: 'Leasing',
        [SIGN_TYPE.CANCEL_LEASING]: 'Leasing cancel',
        [SIGN_TYPE.CREATE_ALIAS]: 'Create Alias',
        [SIGN_TYPE.MASS_TRANSFER]: 'Mass Transfer',
        [SIGN_TYPE.DATA]: 'Data',
        [SIGN_TYPE.SET_SCRIPT]: 'Set Script',
        [SIGN_TYPE.SPONSORSHIP]: 'Sponsorship',
        [SIGN_TYPE.SET_ASSET_SCRIPT]: 'Set Asset Script'
    };

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
            exportLink = WavesApp.origin;
            /**
             * @type {number}
             */
            errorType = null;
            /**
             * @type {string}
             */
            errorMessage = null;
            /**
             * @type {object}
             */
            errorParams = Object.create(null);
            /**
             * @type {boolean}
             */
            isTransaction = false;
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
                this.observe('signable', this.onChangeSignable);
            }

            sendTransaction() {
                const method = ConfirmTxService._getSendMethod(this.signable.type);

                return this.signable.getDataForApi()
                    .then(method)
                    .then(data => {
                        analytics.send(this.getAnalytics(data, true));
                        return data;
                    }, (error) => {
                        analytics.send(this.getAnalytics(this.signable.getTxData(), false));
                        return Promise.reject(error);
                    });
            }

            getEventName(data) {
                if (data.type) {
                    return data.type in ANALYTICS_TX_NAMES ? ANALYTICS_TX_NAMES[data.type] : 'Unknown';
                } else {
                    return ANALYTICS_TX_NAMES[SIGN_TYPE.CREATE_ORDER];
                }
            }

            getAnalytics(data, success) {
                const NAME = this.getEventName(data);
                const name = success ? `${NAME} Transaction Success` : `${NAME} Transaction Error`;
                return { name, params: { type: data.type } };
            }

            confirm() {
                return this.sendTransaction().then(tx => {

                    if (ConfirmTxService._isIssueTx(tx)) {
                        this._saveIssueAsset(tx);
                    }

                    this.step++;
                    this.onTxSent({ id: tx.id });
                    this.__$scope.$apply();
                }).catch(e => {
                    if (e.error) {
                        this.errorType = e.error;
                        this.errorParams = e.params;
                    } else {
                        this.errorMessage = e.message;
                    }
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
                        hasScript: !!(tx.script && tx.script.replace('base64:', '')),
                        height
                    }));
                });
            }

            /**
             * @protected
             */
            initExportLink() {
                const type = this.signable.type;
                this.signable.getDataForApi().then(data => {

                    this.exportLink = `${WavesApp.origin}/#tx${utils.createQS(data)}`;

                    this.canCreateLink = !NO_EXPORT_TYPES.includes(type) &&
                        this.exportLink.length <= WavesApp.MAX_URL_LENGTH;
                    this.__$scope.$apply();
                });
            }

            /**
             * @protected
             */
            onChangeSignable() {
                if (this.signable) {
                    this.isTransaction = this.signable.type < 100;
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

            static _getSendMethod(type) {
                switch (type) {
                    case SIGN_TYPE.CREATE_ORDER:
                        return ds.createOrder;
                    case SIGN_TYPE.CANCEL_ORDER:
                        return ds.cancelOrder;
                    default:
                        return ds.broadcast;
                }
            }

            /**
             * @param {Money} [amount]
             * @return {string | undefined}
             */
            static toBigNumber(amount) {
                return amount && amount.getTokens().toFixed() || undefined;
            }

        }

        return ConfirmTxService;
    };

    factory.$inject = ['Base', 'waves', 'utils', '$mdDialog', 'modalManager'];

    angular.module('app.ui').factory('ConfirmTxService', factory);
})();
