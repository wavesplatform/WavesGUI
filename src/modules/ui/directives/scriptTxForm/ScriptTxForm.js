(function () {
    'use strict';

    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const BASE_64_PREFIX = 'base64:';
    const { libs } = require('@waves/signature-generator');

    /**
     * @param {typeof Base} Base
     * @param {Waves} waves
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @return {ScriptTxForm}
     */
    const controller = function (Base, waves, $scope, user) {

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
            isValid = true;
            /**
             * @type {Function}
             */
            onSuccess = null;
            /**
             * @type {boolean}
             */
            hasScript = user.hasScript();
            /**
             * @type {boolean}
             */
            requiredError = false;
            /**
             * @type {boolean}
             */
            validationError = false;


            constructor() {
                super();
                this.observe('state', this._onChangeState);
                this.observe('script', this._onChangeScript);

                if (!user.hasScript()) {
                    this.observe('script', this._updateRequiredErrorState);
                    this._updateRequiredErrorState();
                }

                this.observe(['requiredError', 'validationError'], this._updateValidationState);
                this._updateValidationState();
            }

            $postLink() {
                this._initScript();
            }

            next() {
                const tx = waves.node.transactions.createTransaction({ ...this.state.tx, type: SIGN_TYPE.SET_SCRIPT });
                this.onSuccess({ tx });
            }

            /**
             * @private
             */
            _updateRequiredErrorState() {
                this.requiredError = !this.script.replace(BASE_64_PREFIX, '');
            }

            /**
             * @private
             */
            _updateValidationState() {
                this.isValid = !this.validationError && !this.requiredError;
            }

            /**
             * @private
             */
            _initScript() {
                const script = this.state && this.state.tx && this.state.tx.script || BASE_64_PREFIX;
                this.script = script.replace(BASE_64_PREFIX, '');
                this.state.tx.script = script;
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
                const script = this.script.replace(BASE_64_PREFIX, '');

                try {
                    libs.base64.toByteArray(script);
                    this.validationError = false;
                    this.state.tx.script = `base64:${script}`;
                } catch (e) {
                    this.validationError = true;
                    this.state.tx.script = '';
                }
            }

        }

        return new ScriptTxForm();
    };

    controller.$inject = ['Base', 'waves', '$scope', 'user'];

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
