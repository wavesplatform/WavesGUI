(function () {
    'use strict';


    /**
     * @param {typeof Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {Waves} waves
     * @return {AnyTransactionForm}
     */
    const controller = function (Base, $scope, waves) {

        const { head } = require('ramda');
        const { SIGN_TYPE } = require('@waves/signature-adapter');
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

                return Promise.all([
                    ds.api.transactions.parseTx([clone])
                        .then(head),
                    AnyTransactionForm._loadTxData(clone)
                ])
                    .then(([data, lease]) => {
                        this.fee = data.fee;

                        try {
                            this.signable = ds.signature.getSignatureApi().makeSignable({
                                type: data.type,
                                data: { ...data, lease }
                            });
                        } catch (e) {
                            return Promise.reject(e);
                        }
                    });
            }

            static _loadTxData(tx) {
                switch (tx.type) {
                    case SIGN_TYPE.CANCEL_LEASING:
                        return waves.node.transactions.get(tx.leaseId);
                    default:
                        return Promise.resolve(Object.create(null));
                }
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
