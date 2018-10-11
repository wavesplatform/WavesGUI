(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {Waves} waves
     * @param {$rootScope.Scope} $scope
     * @return {ScriptTxForm}
     */
    const controller = function (Base, waves, $scope) {

        const { libs } = require('@waves/signature-generator');

        class ScriptTxForm extends Base {

            /**
             * @type {object}
             */
            state = Object.create(null);
            /**
             * @type {string}
             */
            script = '';
            /**
             * @type {boolean}
             */
            scriptValid = false;
            /**
             * @type {Function}
             */
            onSuccess = null;


            $postLink() {
                this.observe('state', this._onChangeState);
                this.observe('script', this._onChangeScript);
            }

            next() {
                this.onSuccess();
            }

            /**
             * @private
             */
            _onChangeState() {
                const state = this.state;

                if (!state.tx) {
                    state.tx = Object.create(null);
                }

                if (!state.tx.fee) {
                    waves.node.getFee({ type: WavesApp.TRANSACTION_TYPES.NODE.SET_SCRIPT }).then(fee => {
                        state.tx.fee = fee;
                        $scope.$apply();
                    });
                }
            }

            /**
             * @private
             */
            _onChangeScript() {
                try {
                    libs.base64.toByteArray(this.script);
                    this.scriptValid = true;
                    this.state.tx.script = `base64:${this.script}`;
                } catch (e) {
                    this.scriptValid = false;
                    this.state.tx.script = '';
                }
            }

        }

        return new ScriptTxForm();
    };

    controller.$inject = ['Base', 'waves', '$scope'];

    angular.module('app.ui').component('wScriptTxForm', {
        controller,
        scope: false,
        bindings: {
            state: '<',
            onSuccess: '&'
        },
        templateUrl: 'modules/ui/directives/scriptTxForm/script-form.html'
    });
})();
