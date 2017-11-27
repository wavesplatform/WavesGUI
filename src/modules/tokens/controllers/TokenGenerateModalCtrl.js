(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {app.user} user
     * @param {app.i18n} i18n
     * @return {TokenGenerateModalCtrl}
     */
    const controller = function (Base, $scope, user, i18n) {

        class TokenGenerateModalCtrl extends Base {

            /**
             * @param {string} amount
             * @param {string} name
             * @param {string} precision
             * @param {boolean} issue
             * @param {string} shownAmount
             */
            constructor({ amount, name, precision, issue, shownAmount }) {
                super($scope);
                /**
                 * Modal step (confirm/success)
                 * @type {number}
                 */
                this.step = 0;
                /**
                 * Tokens count (string from BigNumber)
                 * @type {string}
                 */
                this.amount = amount;
                /**
                 * Formatted and localized tokens count
                 * @type {string}
                 */
                this.shownAmount = shownAmount;
                /**
                 * Token name
                 * @type {string}
                 */
                this.name = name;
                /**
                 * Token precision
                 * @type {number}
                 */
                this.precision = precision;
                /**
                 * Modal title text
                 * @type {null}
                 */
                this.title = null;
                /**
                 * Can token reissue
                 * @type {boolean}
                 */
                this.issue = issue;

                this.observe('step', this._onChangeStep);
                this._onChangeStep();
            }

            _onChangeStep() {
                const step = this.step;

                switch (step) {
                    case 0:
                        this.title = i18n.translate('modal.title', 'app.tokens', { name: this.name });
                        break;
                    case 1:
                        this.title = i18n.translate('modal.titleSuccess', 'app.tokens', { name: this.name });
                        break;
                    default:
                        throw new Error('Wrong step index!');
                }
            }
        }

        return new TokenGenerateModalCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', 'user', 'i18n'];

    angular.module('app.tokens')
        .controller('TokenGenerateModalCtrl', controller);
})();
