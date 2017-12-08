(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {app.utils} utils
     * @return {RestoreCtrl}
     */
    const controller = function (Base, $scope, user, utils) {

        class RestoreCtrl extends Base {

            constructor() {
                super($scope);

                this.seedForm = null;
                /**
                 * @type {string}
                 */
                this.address = null;
                /**
                 * @type {string}
                 */
                this.seed = null;
                /**
                 * @type {string}
                 */
                this.encryptedSeed = null;
                /**
                 * @type {string}
                 */
                this.password = null;

                this.observe('seed', this._onChangeSeed);
                this.observeOnce('seedForm', () => {
                    this.receive(utils.observe(this.seedForm, '$valid'), this._onChangeSeed, this);
                });
            }

            restore() {

                const seedData = Waves.Seed.fromExistingPhrase(this.seed);
                const encryptedSeed = seedData.encrypt(this.password);
                const publicKey = seedData.keyPair.publicKey;

                return user.create({
                    address: this.address,
                    password: this.password,
                    settings: { termsAccepted: false },
                    encryptedSeed,
                    publicKey
                }, true);
            }

            /**
             * @private
             */
            _onChangeSeed() {
                if (this.seedForm.$valid) {
                    this.address = Waves.Seed.fromExistingPhrase(this.seed).address;
                } else {
                    this.address = '';
                }
            }

        }

        return new RestoreCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils'];

    angular.module('app.restore').controller('RestoreCtrl', controller);
})();
