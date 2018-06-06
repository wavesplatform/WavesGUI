(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {app.utils} utils
     * @param modalManager
     * @return {RestoreCtrl}
     */
    const controller = function (Base, $scope, user, utils, modalManager) {

        class RestoreCtrl extends Base {

            constructor() {
                super($scope);

                this.seedForm = null;
                /**
                 * @type {string}
                 */
                this.address = '';
                /**
                 * @type {string}
                 */
                this.seed = '';
                /**
                 * @type {string}
                 */
                this.name = '';
                /**
                 * @type {string}
                 */
                this.encryptedSeed = '';
                /**
                 * @type {string}
                 */
                this.password = '';

                this.observe('seed', this._onChangeSeed);
                this.observeOnce('seedForm', () => {
                    this.receive(utils.observe(this.seedForm, '$valid'), this._onChangeSeed, this);
                });
            }

            showTutorialModals() {
                return modalManager.showTutorialModals();
            }

            restore() {

                const seedData = new ds.Seed(this.seed);
                const encryptedSeed = seedData.encrypt(this.password);
                const keyPair = seedData.keyPair;

                return user.create({
                    address: this.address,
                    api: ds.signature.getDefaultSignatureApi(keyPair, this.address, seedData.phrase),
                    name: this.name,
                    password: this.password,
                    settings: { termsAccepted: false },
                    encryptedSeed,
                    publicKey: keyPair.publicKey
                }, true);
            }

            resetNameAndPassword() {
                this.name = '';
                this.password = '';
            }

            /**
             * @private
             */
            _onChangeSeed() {
                if (this.seedForm.$valid) {
                    this.address = new ds.Seed(this.seed).address;
                } else {
                    this.address = '';
                }
            }

        }

        return new RestoreCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils', 'modalManager'];

    angular.module('app.restore').controller('RestoreCtrl', controller);
})();
