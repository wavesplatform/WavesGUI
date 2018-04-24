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

        class TokensCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * Link to angular form object
                 * @type {form.FormController}
                 */
                this.createForm = null;
                /**
                 * Token name
                 * @type {string}
                 */
                this.name = '';
                /**
                 * Token description
                 * @type {string}
                 */
                this.description = '';
                /**
                 * Can reissue this token
                 * @type {boolean}
                 */
                this.issue = true;
                /**
                 * Count of generated tokens
                 * @type {BigNumber}
                 */
                this.count = null;
                /**
                 * Precision of token
                 * @type {BigNumber}
                 */
                this.precision = null;
                /**
                 * @type {BigNumber}
                 */
                this.maxCoinsCount = null;
                /**
                 * Has money for fee
                 * @type {boolean}
                 */
                this.invalid = false;
                /**
                 * @type {Money}
                 * @private
                 */
                this._balance = null;
                /**
                 * @type {Money}
                 * @private
                 */
                this._fee = null;

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

            generate() {
                const precision = Number(this.precision.toString());

                return modalManager.showConfirmTx('issue', {
                    name: this.name,
                    description: this.description,
                    reissuable: this.issue,
                    quantity: this.count,
                    precision,
                    fee: this._fee
                }).then(() => this._reset());
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
                if (value && value.lte(8)) {
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

