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
                const workerHandler = (Waves, data) => {
                    const seedData = Waves.Seed.fromExistingPhrase(data.seedPhrase);
                    return {
                        address: seedData.address,
                        encryptedSeed: seedData.encrypt(data.password)
                    };
                };

                apiWorker.process(workerHandler, workerData)
                    .then((data) => {
                        return user.addUserData({
                            address: data.address,
                            password: this.password,
                            encryptedSeed: data.encryptedSeed
                        })
                    });
            }

        }

        return new RestoreCtrl();
    };

    controller.$inject = ['Base', '$scope', 'apiWorker', 'user'];

    angular.module('app.restore').controller('RestoreCtrl', controller);
})();
