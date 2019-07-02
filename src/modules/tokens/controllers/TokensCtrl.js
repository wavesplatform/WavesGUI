(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {ModalManager} modalManager
     * @param {Waves} waves
     * @param {BalanceWatcher} balanceWatcher
     * @param {User} user
     * @param {app.utils} utils
     * @param {PromiseControl} PromiseControl
     */
    const controller = function (Base, $scope, modalManager, waves, balanceWatcher, user, utils, PromiseControl) {

        const { SIGN_TYPE } = require('@waves/signature-adapter');
        const { WAVES_ID } = require('@waves/signature-generator');
        const ds = require('data-service');
        const $ = require('jquery');
        const BASE_64_PREFIX = 'base64:';


        class TokensCtrl extends Base {

            /**
             * @type {boolean}
             */
            focusName = false;

            /**
             * @type {PromiseControl}
             */
            _findNamePC = null;

            /**
             * @type {boolean}
             */
            agreeConditions = false;

            /**
             * @type {boolean}
             */
            nameWarning = false;

            /**
             * Link to angular form object
             * @type {form.FormController}
             */
            createForm = null;
            /**
             * @type {string}
             */
            assetId = '';
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
             * @type {number}
             */
            precision = 0;
            /**
             * @type {BigNumber}
             */
            maxCoinsCount = WavesApp.maxCoinsCount;
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
             * @type {boolean}
             */
            hasAssetScript = false;
            /**
             * @type {Signable}
             */
            signable = null;
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
                this.observe([
                    'name',
                    'count',
                    'script',
                    'precision',
                    'description',
                    'issue',
                    'hasAssetScript'
                ], this.createSignable);

                waves.node.getFee({ type: SIGN_TYPE.ISSUE })
                    .then(money => {
                        this.fee = money;

                        this._onChangeBalance();
                        $scope.$apply();
                    });

                this.observeOnce('createForm', () => {
                    this.receive(utils.observe(this.createForm, '$valid'), this.createSignable, this);
                });
            }

            /**
             * @param {boolean} focus
             */
            onNameFocus(focus) {
                this.focusName = !!focus;
            }

            generate(signable) {
                return modalManager.showConfirmTx(signable)
                    .then(() => this._reset());
            }

            sendAnalytics() {
                analytics.send({ name: 'Token Generation Info Show', target: 'ui' });
            }

            getSignable() {
                return this.signable;
            }

            createSignable() {
                this._verifyName().then(
                    res => {
                        this.nameWarning = res;
                        $scope.$apply();
                    }
                );

                if (!this.name || !this.createForm || !this.createForm.$valid) {
                    this.assetId = '';
                    return null;
                }

                const precision = Number(this.precision.toString());
                const quantity = (this.count || new BigNumber(0)).times(Math.pow(10, precision));
                const script = this.hasAssetScript && this.script ? `${BASE_64_PREFIX}${this.script}` : '';

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

                this.signable = ds.signature.getSignatureApi().makeSignable({ type: tx.type, data: tx });

                this.signable.getId().then(id => {
                    this.assetId = id;
                    utils.safeApply($scope);
                });
            }

            /**
             * @return {*}
             * @private
             */
            _verifyName() {
                if (this._findNamePC != null) {
                    this._findNamePC.abort();
                }
                this._findNamePC = new PromiseControl(utils.wait(1000));
                return this._findNamePC
                    .then(() => utils.assetNameWarning(this.name));
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
                if (value && value <= 8) {
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

                $scope.$apply();
            }

            /**
             * @private
             */
            _reset() {

                this.name = '';
                this.description = '';
                this.issue = true;
                this.count = new BigNumber(0);
                this.precision = 0;
                this.maxCoinsCount = WavesApp.maxCoinsCount;
                this.script = '';
                this.hasAssetScript = false;

                this.createForm.$setPristine();
                this.createForm.$setUntouched();

                $scope.$apply();
            }

        }

        return new TokensCtrl();
    };

    controller.$inject = ['Base', '$scope', 'modalManager',
        'waves', 'balanceWatcher', 'user', 'utils', 'PromiseControl'];

    angular.module('app.tokens')
        .controller('TokensCtrl', controller);
})();

