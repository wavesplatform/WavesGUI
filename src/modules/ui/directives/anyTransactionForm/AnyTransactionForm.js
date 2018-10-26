(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {$rootScope.Scope} $scope
     * @return {AnyTransactionForm}
     */
    const controller = function (Base, $scope) {

        const { head } = require('ramda');
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

                WavesApp.parseJSON(json)
                    .then(data => {
                        this._updateSignable(data);
                        this.isValidJSON = true;
                    })
                    .catch(() => {
                        this.isValidJSON = false;
                    });
            }

            /**
             * @private
             */
            _updateSignable(data) {
                const clone = Object.keys(data).reduce((acc, name) => {
                    const value = AnyTransactionForm._normalizeValue(data[name]);
                    acc[name] = value;
                    return acc;
                }, Object.create(null));

                ds.api.transactions.parseTx([clone])
                    .then(head)
                    .then(data => {
                        this.fee = data.fee;
                        this.signable = ds.signature.getSignatureApi().makeSignable({
                            type: data.type,
                            data
                        });
                        $scope.$apply();
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

        }

        return new AnyTransactionForm();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.ui').component('wAnyTransactionForm', {
        controller,
        scope: false,
        bindings: {
            state: '<',
            onSuccess: '&'
        },
        templateUrl: 'modules/ui/directives/anyTransactionForm/any-tx-form.html'
    });
})();
