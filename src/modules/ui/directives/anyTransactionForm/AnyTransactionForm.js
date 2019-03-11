(function () {
    'use strict';


    /**
     * @param {typeof Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {Waves} waves
     * @return {AnyTransactionForm}
     */
    const controller = function (Base, $scope, waves) {

        const { indexBy, prop, head } = require('ramda');
        const { SIGN_TYPE } = require('@waves/signature-adapter');
        const { Money } = require('@waves/data-entities');
        const ds = require('data-service');


        class AnyTransactionForm extends Base {

            /**
             * @type {object}
             */
            state = Object.create(null);
            /**
             * @type {string}
             */
            json = '';
            /**
             * @type {Function}
             */
            onSuccess = null;
            /**
             * @type {boolean}
             */
            isValidJSON = true;
            /**
             * @type {Signable}
             */
            signable = null;


            constructor() {
                super();
                this.observe('json', this._onChangeJSON);
                this.observe('state', this._onChangeState);
            }

            next() {
                this.onSuccess({ signable: this.signable });
            }

            /**
             * @private
             */
            _onChangeState() {
                const state = this.state;

                if (!state.tx) {
                    state.tx = Object.create(null);
                } else if (state.tx) {
                    try {
                        this.json = WavesApp.stringifyJSON(this.state.tx, null, 4);
                    } catch (e) {
                        // TODO add error
                        this.json = '';
                    }
                }
            }

            /**
             * @private
             */
            _onChangeJSON() {
                this.isValidJSON = false;
                const json = this.json;
                this.fee = null;

                if (!this.json) {
                    this.isValidJSON = true;
                    return null;
                }

                WavesApp.parseJSON(json)
                    .then(data => this._updateSignable(data)
                        .then(() => {
                            this.state.tx = data;
                            this.isValidJSON = true;
                        }))
                    .catch(() => {
                        this.state.tx = null;
                        this.isValidJSON = false;
                    })
                    .then(() => {
                        $scope.$apply();
                    });
            }

            /**
             * @private
             */
            _updateSignable(data) {
                if (!data) {
                    return Promise.resolve(null);
                }

                const clone = Object.keys(data).reduce((acc, name) => {
                    const value = AnyTransactionForm._normalizeValue(data[name]);
                    acc[name] = value;
                    return acc;
                }, Object.create(null));

                const type = AnyTransactionForm._normalizeSignType(clone);

                return AnyTransactionForm._parse(type, clone).then(data => {
                    this.fee = data.fee;

                    if (data.type === SIGN_TYPE.SET_SCRIPT && !data.script) {
                        data.script = '';
                    }
                    if (data.type === SIGN_TYPE.TRANSFER || data.type === SIGN_TYPE.MASS_TRANSFER) {
                        data.attachment = Array.from(data.attachment);
                    }

                    try {
                        this.signable = ds.signature.getSignatureApi().makeSignable({
                            type,
                            data
                        });
                    } catch (e) {
                        return Promise.reject(e);
                    }
                });
            }

            static _normalizeValue = value => {
                if (value === 'true') {
                    return true;
                }

                if (value === 'false') {
                    return false;
                }

                const num = Number(value);
                return String(num) === value ? num : value;
            };

            static _parse(type, data) {
                switch (type) {
                    case SIGN_TYPE.CREATE_ORDER:
                        return AnyTransactionForm._parseOrder(data);
                    case SIGN_TYPE.CANCEL_ORDER:
                        return Promise.resolve(data);
                    default:
                        return AnyTransactionForm._parseTransaction(data);
                }
            }

            static _parseOrder(data) {
                const moneyFactory = ds.api.matcher.factory;
                return Promise.all([
                    waves.node.assets.getAsset('WAVES'),
                    waves.node.assets.getAsset(ds.utils.normalizeAssetId(data.assetPair.amountAsset)),
                    waves.node.assets.getAsset(ds.utils.normalizeAssetId(data.assetPair.priceAsset))
                ])
                    .then(indexBy(prop('id')))
                    .then(hash => {
                        return ds.api.transactions.parseExchangeOrder(moneyFactory, data, hash);
                    });
            }

            static _parseTransaction(data) {
                switch (data.type) {
                    case SIGN_TYPE.CANCEL_LEASING:
                        return Promise.all([
                            AnyTransactionForm._parseDefaultTransaction(data),
                            waves.node.transactions.get(data.leaseId)
                        ]).then(([tx, lease]) => ({ ...tx, lease }));
                    case SIGN_TYPE.BURN:
                        return Promise.all([
                            AnyTransactionForm._parseDefaultTransaction(data),
                            waves.node.assets.getAsset(data.assetId)
                        ]).then(([tx, asset]) => ({ ...tx, amount: new Money(tx.quantity, asset) }));
                    default:
                        return AnyTransactionForm._parseDefaultTransaction(data);
                }
            }

            static _parseDefaultTransaction(data) {
                return ds.api.transactions.parseTx([data])
                    .then(head);
            }

            /**
             * @param {{[type]: number, [orderType]: string, [id]: string}} data
             * @return number
             * @private
             */
            static _normalizeSignType(data) {
                if (data.type && SIGN_TYPE[data.type]) {
                    return data.type;
                }
                if (data.orderType && ['sell', 'buy'].includes(data.orderType)) {
                    return SIGN_TYPE.CREATE_ORDER;
                }
                if (data.id && typeof data.id === 'string') {
                    return SIGN_TYPE.CANCEL_ORDER;
                }
            }

        }

        return new AnyTransactionForm();
    };

    controller.$inject = ['Base', '$scope', 'waves'];

    angular.module('app.ui').component('wAnyTransactionForm', {
        controller,
        scope: false,
        bindings: {
            state: '=',
            onSuccess: '&'
        },
        templateUrl: 'modules/ui/directives/anyTransactionForm/any-tx-form.html'
    });
})();
