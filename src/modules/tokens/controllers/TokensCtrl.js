(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {ModalManager} modalManager
     * @param {BalanceWatcher} balanceWatcher
     * @param {Waves} waves
     * @param {User} user
     */
    const controller = function (Base, $scope, modalManager, waves, balanceWatcher, user) {

        const { SIGN_TYPE } = require('@waves/signature-adapter');
        const { WAVES_ID } = require('@waves/signature-generator');
        const ds = require('data-service');
        const $ = require('jquery');
        const BASE_64_PREFIX = 'base64:';

        class TokensCtrl extends Base {

            /**
             * Link to angular form object
             * @type {form.FormController}
             */
            createForm = null;
            /**
             * Token name
             * @type {string}
             */
            name = '';
            /**
             * Token description
             * @type {string}
             */
            description = '';
            /**
             * Can reissue this token
             * @type {boolean}
             */
            issue = true;
            /**
             * Count of generated tokens
             * @type {BigNumber}
             */
            count = null;
            /**
             * Precision of token
             * @type {BigNumber}
             */
            precision = null;
            /**
             * @type {BigNumber}
             */
            maxCoinsCount = null;
            /**
             * Has money for fee
             * @type {boolean}
             */
            invalid = false;
            /**
             * @type {string}
             */
            script = '';
            /**
             * @type {boolean}
             */
            isValidScript = true;
            /**
             * @type {boolean}
             */
            scriptPending = false;
            /**
             * @type {Money}
             */
            fee = null;
            /**
             * @type {JQueryXHR | null}
             * @private
             */
            _scriptValidationXHR = null;
            /**
             * @type {Money}
             * @private
             */
            _balance;


            constructor() {
                super($scope);

                this.receive(balanceWatcher.change, this._onChangeBalance, this);

                this.observe('precision', this._onChangePrecision);
                this.observe('script', this._onChangeScript);

                waves.node.getFee({ type: SIGN_TYPE.ISSUE })
                    .then(money => {
                        this.fee = money;

                        this._onChangeBalance();
                        $scope.$digest();
                    });
            }

            generate(signable) {
                return modalManager.showConfirmTx(signable).then(() => this._reset());
            }

            createSignable() {
                const precision = Number(this.precision.toString());
                const quantity = this.count.times(Math.pow(10, precision));
                const script = this.script ? `${BASE_64_PREFIX}${this.script}` : '';

                const tx = waves.node.transactions.createTransaction({
                    type: SIGN_TYPE.ISSUE,
                    name: this.name,
                    description: this.description,
                    reissuable: this.issue,
                    quantity,
                    precision,
                    script,
                    fee: this.fee
                });

                return ds.signature.getSignatureApi().makeSignable({ type: tx.type, data: tx });
            }

            /**
             * @return {null}
             * @private
             */
            _onChangeScript() {
                if (this._scriptValidationXHR) {
                    this._scriptValidationXHR.abort();
                    this.scriptPending = false;
                }
                const script = this.script.replace(BASE_64_PREFIX, '');

                if (!script) {
                    this.isValidScript = true;
                    this.scriptPending = false;
                    return null;
                }

                this.isValidScript = true;
                this.scriptPending = true;
                this._scriptValidationXHR = $.ajax({
                    method: 'POST',
                    url: `${user.getSetting('network.node')}/utils/script/estimate`,
                    data: script
                });

                this._scriptValidationXHR
                    .then(() => {
                        this.isValidScript = true;
                    })
                    .catch(() => {
                        this.isValidScript = false;
                    })
                    .always(() => {
                        this.scriptPending = false;
                        $scope.$apply();
                    });
            }

            /**
             * @param {BigNumber} value
             * @private
             */
            _onChangePrecision({ value }) {
                if (value && value.lte(8)) {
                    this.maxCoinsCount = WavesApp.maxCoinsCount.div(Math.pow(10, Number(value)));
                }
            }

            /**
             * Current can i send transaction (balance gt fee)
             * @private
             */
            _onChangeBalance() {
                this._balance = balanceWatcher.getBalance()[WAVES_ID];

                this.invalid = (!this.fee || !this._balance) ||
                    this._balance.getTokens().lt(this.fee.getTokens());
            }

            /**
             * @private
             */
            _reset() {

                this.name = '';
                this.description = '';
                this.issue = true;
                this.count = null;
                this.precision = null;
                this.maxCoinsCount = null;
                this.script = '';

                this.createForm.$setPristine();
                this.createForm.$setUntouched();
            }

        }

        return new TokensCtrl();
    };

    controller.$inject = ['Base', '$scope', 'modalManager', 'waves', 'balanceWatcher', 'user'];

    angular.module('app.tokens')
        .controller('TokensCtrl', controller);
})();

