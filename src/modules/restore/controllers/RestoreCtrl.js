(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {app.utils.apiWorker} apiWorker
     * @param {User} user
     * @return {RestoreCtrl}
     */
    const controller = function (Base, $scope, apiWorker, user) {

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
            }

            restore() {
                apiWorker.process((WavesAPI, { seed, password }) => {
                    return WavesAPI.Seed.fromExistingPhrase(seed).encrypt(password);
                }, { seed: this.seed, password: this.password }).then((encryptedSeed) => {
                    user.addUserData({
                        address: this.address,
                        encryptedSeed: encryptedSeed,
                        password: this.password,
                        settings: { termsAccepted: false }
                    });
                });
            }

            _onChangeSeed() {
                if (this.seedForm.$valid) {
                    apiWorker.process((WavesAPI, seed) => {
                        return WavesAPI.Seed.fromExistingPhrase(seed).address;
                    }, this.seed).then((address) => {
                        this.address = address;
                    });
                } else {
                    this.address = '';
                }
            }

        }

        return new RestoreCtrl();
    };

    controller.$inject = ['Base', '$scope', 'apiWorker', 'user'];

    angular.module('app.restore').controller('RestoreCtrl', controller);
})();
