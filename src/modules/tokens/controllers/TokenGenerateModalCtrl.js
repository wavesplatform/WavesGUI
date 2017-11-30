(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {app.i18n} i18n
     * @param {Waves} waves
     * @param {NotificationManager} notificationManager
     * @return {TokenGenerateModalCtrl}
     */
    const controller = function (Base, $scope, user, i18n, waves, notificationManager) {

        class TokenGenerateModalCtrl extends Base {

            /**
             * @param {string} amount
             * @param {string} name
             * @param {string} description
             * @param {string} precision
             * @param {boolean} issue
             * @param {string} shownAmount
             */
            constructor({ amount, description, name, precision, issue, shownAmount }) {
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
                 * Token description
                 * @type {string}
                 */
                this.description = description;
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

            generate() {
                return user.getSeed()
                    .then((seed) => waves.node.assets.issue({
                        name: this.name,
                        description: this.description,
                        quantity: this.amount,
                        reissuable: this.issue,
                        precision: this.precision,
                        keyPair: seed.keyPair
                    }))
                    .then(() => {
                        this.step++;
                    })
                    .catch(() => {
                        notificationManager.error({
                            ns: 'app',
                            title: { literal: 'Token has not been created' }
                        });
                    });
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

    controller.$inject = ['Base', '$scope', 'user', 'i18n', 'waves', 'notificationManager'];

    angular.module('app.tokens')
        .controller('TokenGenerateModalCtrl', controller);
})();
