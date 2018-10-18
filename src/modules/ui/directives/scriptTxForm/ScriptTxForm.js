(function () {
    'use strict';

    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const BASE_64_PREFIX = 'base64:';
    const { uniqueId } = require('ts-utils');
    const { fetch } = require('data-service');

    /**
     * @param {typeof Base} Base
     * @param {Waves} waves
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @param {BalanceWatcher} balanceWatcher
     * @return {ScriptTxForm}
     */
    const controller = function (Base, waves, $scope, user, balanceWatcher) {

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
            /**
             * @type {string}
             */
            placeHolderLiteral = user.hasScript() ? 'change' : 'create';
            /**
             * @type {boolean}
             */
            validationPending = false;
            /**
             * @type {boolean}
             */
            hasFee = false;
            /**
             * @type {Promise}
             * @private
             */
            _validateXHR = null;
            /**
             * @type {string}
             * @private
             */
            _activeXHR_Id = null;


            constructor() {
                super();
                this.observe('state', this._onChangeState);
                this.observe('script', this._onChangeScript);

                this.receive(balanceWatcher.change, () => {
                    this._currentHasFee();
                    $scope.$apply();
                });

                if (!user.hasScript()) {
                    this.observe('script', this._updateRequiredErrorState);
                    this._updateRequiredErrorState();
                }

                this.observe(['requiredError', 'validationError'], this._updateValidationState);
                this._updateValidationState();
                this._currentHasFee();
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
            _currentHasFee() {
                if (!this.state || !this.state.tx || !this.state.tx.fee) {
                    return null;
                }

                const balanceHash = balanceWatcher.getBalance();
                const fee = this.state.tx.fee;
                this.hasFee = balanceHash[fee.asset.id] && balanceHash[fee.asset.id].gt(fee);
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
                        this._currentHasFee();
                        $scope.$apply();
                    });
                }
            }

            /**
             * @private
             */
            _onChangeScript() {
                const script = this.script.replace(BASE_64_PREFIX, '');

                this._clearActiveValidationXHR();
                this._createActiveValidationXHR(script);
            }

            _clearActiveValidationXHR() {
                this._activeXHR_Id = null;
                this._validateXHR = null;
                this.validationPending = false;
            }

            _createActiveValidationXHR(code) {
                if (code === '') {
                    this.validationError = false;
                    return null;
                }

                this.validationPending = true;
                const id = uniqueId('script-form-validate');
                this._activeXHR_Id = id;
                this._validateXHR = fetch(`${user.getSetting('network.node')}/utils/script/estimate`, {
                    method: 'POST',
                    body: code
                })
                    .then(() => {
                        if (this._activeXHR_Id !== id) {
                            return null;
                        }
                        this._clearActiveValidationXHR();
                        this.validationError = false;
                        this.state.tx.script = `${BASE_64_PREFIX}${code}`;
                    })
                    .catch(() => {
                        if (this._activeXHR_Id !== id) {
                            return null;
                        }
                        this._clearActiveValidationXHR();
                        this.validationError = true;
                        this.state.tx.script = BASE_64_PREFIX;
                    })
                    .then(() => {
                        $scope.$apply();
                    });
            }

        }

        return new ScriptTxForm();
    };

    controller.$inject = ['Base', 'waves', '$scope', 'user', 'balanceWatcher'];

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
