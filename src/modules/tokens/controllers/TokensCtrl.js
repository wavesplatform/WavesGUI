(function () {
    'use strict';

    const MAX_OF_COINS_COUNT = new BigNumber('9223372036854775807');

    /**
     * @param Base
     * @param $scope
     * @param {ModalManager} modalManager
     * @return {TokensCtrl}
     */
    const controller = function (Base, $scope, modalManager) {

        class TokensCtrl extends Base {

            constructor() {
                super($scope);
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

                this.observe('precision', this._onChangePrecision);
            }

            generate() {
                const precision = Number(this.precision.toString());
                const amount = this.count.mul(Math.pow(10, precision)).toString();

                modalManager.showCustomModal({
                    ns: 'app.tokens',
                    controller: 'TokenGenerateModalCtrl',
                    titleContent: '{{$ctrl.title}}',
                    mod: 'tokens-generate-modal',
                    contentUrl: 'modules/tokens/templates/generate.modal.html',
                    locals: {
                        shownAmount: this.count.toFormat(precision),
                        name: this.name,
                        issue: this.issue,
                        description: this.description,
                        amount,
                        precision
                    }
                })
                    .finally(() => {
                        this.name = '';
                        this.description = '';
                        this.issue = true;
                        this.count = null;
                        this.precision = null;
                    });
            }

            /**
             * @param {BigNumber} value
             * @private
             */
            _onChangePrecision({ value }) {
                if (value) {
                    this.maxCoinsCount = MAX_OF_COINS_COUNT.div(Math.pow(10, Number(value)));
                }
            }

        }

        return new TokensCtrl();
    };

    controller.$inject = ['Base', '$scope', 'modalManager'];

    angular.module('app.tokens')
        .controller('TokensCtrl', controller);
})();

