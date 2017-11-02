(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param $scope
     * @param {User} user
     * @param {app.utils.apiWorker} apiWorker
     * @param {app.utils} utils
     * @param {*} $mdDialog
     * @return {EnterPasswordCtrl}
     */
    const controller = function (Base, $scope, user, apiWorker, utils, $mdDialog) {

        class EnterPasswordCtrl extends Base {

            constructor() {
                super($scope);
                this.password = '';
                this.encryptionRoundsPromise = user.getSetting('encryptionRounds');
                this.pending = false;
            }

            ok() {
                if (this.pending) {
                    return null;
                }
                this.pending = true;
                this.encryptionRoundsPromise.then((encryptionRounds) => {
                    apiWorker.process((WavesApi, data) => {

                        const phrase = WavesApi
                            .Seed
                            .decryptSeedPhrase(data.encryptedSeed, data.password, data.encryptionRounds);

                        return WavesApi.Seed.fromExistingPhrase(phrase);
                    }, { encryptionRounds, encryptedSeed: user.encryptedSeed, password: this.password })
                        .then((seed) => {
                            $mdDialog.hide(seed);
                        })
                        .catch(() => {
                            this.pending = false;
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
