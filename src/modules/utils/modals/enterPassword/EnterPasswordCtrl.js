(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param $scope
     * @param {User} user
     * @param {app.utils.apiWorker} apiWorker
     * @param {app.utils} utils
     * @param {*} $mdDialog
     * @returns {EnterPasswordCtrl}
     */
    const controller = function (Base, $scope, user, apiWorker, utils, $mdDialog) {

        class EnterPasswordCtrl extends Base {

            constructor() {
                super($scope);
                this.password = '';
                this.encryptionRoundsPromise = user.getSetting('encryptionRounds');
            }

            ok() {
                this.encryptionRoundsPromise.then((encryptionRounds) => {
                    apiWorker.process((WavesApi, data) => {

                        const phrase = WavesApi
                            .Seed
                            .decryptSeedPhrase(data.encryptedSeed, data.password, data.encryptionRounds);

                        return WavesApi.Seed.fromExistingPhrase(phrase);
                    }, { encryptionRounds, encryptedSeed: user.encryptedSeed, password: this.password })
                        .then((seed) => {
                            $mdDialog.hide(seed);
                        });
                });
            }

            cancel() {
                $mdDialog.cancel();
            }

        }

        return new EnterPasswordCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'apiWorker', 'utils', '$mdDialog'];

    angular.module('app')
        .controller('EnterPasswordCtrl', controller);
})();
