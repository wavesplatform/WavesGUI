(function () {
    'use strict';

    /**
     * @param Base
     * @param {ng.$scope} $scope
     * @param seedService
     * @param {User} user
     * @return {SeedBackupModalsCtrl}
     */
    const controller = function (Base, $scope, seedService, user) {

        class SeedBackupModalsCtrl extends Base {

            /**
             * @param {Seed} seed
             */
            constructor(seed) {
                super($scope);

                /**
                 * @type {string}
                 */
                this.titleLiteral = '';
                /**
                 * @type {number}
                 */
                this.step = null;
                /**
                 * @type {Seed}
                 */
                this.seed = seed;
                /**
                 * @type {boolean}
                 */
                this.seedConfirmWasFilled = false;
                /**
                 * @type {boolean}
                 */
                this.seedIsValid = false;

                this.observe('step', this._onChangeStep);

                this.step = 0;
            }

            onSeedConfirmFulfilled(isValid) {
                this.seedIsValid = isValid;
                this.seedConfirmWasFilled = true;
            }

            seedOnTouch() {
                this.seedConfirmWasFilled = false;
            }

            clear() {
                this.seedIsValid = false;
                this.seedConfirmWasFilled = false;
                seedService.clear.dispatch();
            }

            /**
             * @private
             */
            _onChangeStep() {
                this.seedIsValid = false;
                this.seedConfirmWasFilled = false;
                this.titleLiteral = `title_${this.step}`;
                if (this.step === 2) {
                    user.setSetting('hasBackup', true);
                }
            }

        }

        return new SeedBackupModalsCtrl(this.seed);
    };

    controller.$inject = ['Base', '$scope', 'seedService', 'user'];

    angular.module('app.utils').controller('SeedBackupModalsCtrl', controller);
})();
