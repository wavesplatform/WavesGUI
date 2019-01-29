(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {ModalManager} modalManager
     * @param {IPollCreate} createPoll
     * @param {Waves} waves
     * @return {TokensCtrl}
     */
    const controller = function (Base, $scope, modalManager, createPoll, waves) {

        const { SIGN_TYPE } = require('@waves/signature-adapter');
        const ds = require('data-service');

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
             * @type {number}
             */
            precision = 0;
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
             * @type {Money}
             * @private
             */
            _balance = null;
            /**
             * @type {Money}
             * @private
             */
            _fee = null;

            constructor() {
                super($scope);

                const poll = createPoll(this, this._getBalance, '_balance', 5000, { isBalance: true, $scope });

                this.observe('precision', this._onChangePrecision);

                Promise.all([waves.node.getFee({ type: WavesApp.TRANSACTION_TYPES.NODE.ISSUE }), poll.ready])
                    .then(([money]) => {
                        this._fee = money;
                        this.observe(['_balance', '_fee'], this._onChangeBalance);

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

                const tx = waves.node.transactions.createTransaction({
                    type: SIGN_TYPE.ISSUE,
                    name: this.name,
                    description: this.description,
                    reissuable: this.issue,
                    quantity,
                    precision,
                    fee: this._fee,
                    createToken: true
                });

                return ds.signature.getSignatureApi().makeSignable({ type: tx.type, data: tx });
            }

            /**
             * @return {Promise<Money>}
             * @private
             */
            _getBalance() {
                return waves.node.assets.balance(WavesApp.defaultAssets.WAVES);
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
                this.invalid = (!this._fee || !this._balance) ||
                    this._balance.available.getTokens().lt(this._fee.getTokens());
            }

            _reset() {

                this.name = '';
                this.description = '';
                this.issue = true;
                this.count = null;
                this.precision = null;
                this.maxCoinsCount = null;

                this.createForm.$setPristine();
                this.createForm.$setUntouched();
            }

        }

        return new TokensCtrl();
    };

    controller.$inject = ['Base', '$scope', 'modalManager', 'createPoll', 'waves'];

    angular.module('app.tokens')
        .controller('TokensCtrl', controller);
})();

