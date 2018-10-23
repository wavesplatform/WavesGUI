(function () {
    'use strict';

    const controller = function (Base) {

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


            constructor() {
                super();
                this.observe('state', this._onChangeState);
                this.observe('json', this._onChangeJSON);
            }

            /**
             * @private
             */
            _onChangeState() {
                const state = this.state;

                if (!state.tx) {
                    state.tx = Object.create(null);
                }
            }

            /**
             * @private
             */
            _onChangeJSON() {
                this.isValidJSON = true;
                const json = this.json;
                try {
                    this._data = JSON.parse(json);
                } catch (e) {
                    this.isValidJSON = false;
                }
            }

        }

        return new AnyTransactionForm();
    };

    controller.$inject = ['Base'];

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
