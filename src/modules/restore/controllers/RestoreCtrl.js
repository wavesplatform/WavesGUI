(function () {
    'use strict';

    const controller = function (Base, $scope, apiWorker, user) {

        // TODO : split in two steps

        class RestoreCtrl extends Base {

            constructor() {
                super($scope);
                this.seedPhrase = '';
                this.password = '';
                this.confirmPassword = '';
            }

            restore() {

                if (!this.seedPhrase) {
                    throw new Error('Seed phrase is needed');
                }

                const workerData = { seedPhrase: this.seedPhrase, password: this.password };
                const workerHandler = (Waves, { seedPhrase, password }) => {
                    const seedData = Waves.Seed.fromExistingPhrase(seedPhrase);
                    return {
                        address: seedData.address,
                        encryptedSeed: seedData.encrypt(password)
                    };
                };

                apiWorker.process(workerHandler, workerData)
                    .then(({ address, password, encryptedSeed }) => {
                        return user.addUserData({ address, password, encryptedSeed });
                    });
            }

        }

        return new RestoreCtrl();
    };

    controller.$inject = ['Base', '$scope', 'apiWorker', 'user'];

    angular.module('app.restore').controller('RestoreCtrl', controller);
})();
