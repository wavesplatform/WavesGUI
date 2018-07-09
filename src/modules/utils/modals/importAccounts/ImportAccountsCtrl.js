(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {app.utils} utils
     * @returns {ImportAccountsCtrl}
     */
    const controller = function (Base, $scope, utils) {

        class ImportAccountsCtrl extends Base {

            constructor() {
                super($scope);

                this.pending = true;
                this.userList = [];

                Promise.all([
                    utils.importAccountByIframe(WavesApp.betaOrigin, 5000)
                        .catch(() => []),
                    utils.importAccountByIframe('https://waveswallet.io', 5000)
                        .catch(() => [])
                        .then(utils.remapOldClientAccounts)
                ])
                    .then(([beta, old]) => {
                        const betaHash = utils.toHash(beta, 'address');
                        const oldHash = utils.toHash(old, 'address');

                        this.pending = false;
                    });
            }

        }

        return new ImportAccountsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'utils'];

    angular.module('app.utils').controller('ImportAccountsCtrl', controller);
})();
