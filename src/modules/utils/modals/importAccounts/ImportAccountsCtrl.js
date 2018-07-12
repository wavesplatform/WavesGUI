(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {User} user
     * @param {Storage} storage
     * @param {*} $state
     * @returns {ImportAccountsCtrl}
     */
    const controller = function (Base, $scope, utils, user, storage, $state) {

        const R = require('ramda');

        const OLD_ORIGIN = 'https://waveswallet.io';

        class ImportAccountsCtrl extends Base {

            constructor() {
                super($scope);

                this.pending = true;
                this.userList = [];
                this.wasImportBeta = false;
                this.wasImportOld = false;
                this.checkedHash = Object.create(null);

                Promise.all([
                    utils.importAccountByIframe(WavesApp.betaOrigin, 5000)
                        .catch(() => []),
                    utils.importAccountByIframe('https://waveswallet.io', 5000)
                        .catch(() => []),
                    user.getUserList()
                ])
                    .then(([beta, old, userList]) => {
                        this.pending = false;

                        const myUsersHash = utils.toHash(userList || [], 'address');
                        this.userList = R.pipe(
                            R.uniqBy(R.prop('address')),
                            R.filter(user => !myUsersHash[user.address])
                        )(beta.concat(old));

                        $scope.$apply();
                    });
            }

            importAccounts() {
                const users = Object.keys(this.checkedHash).map((address) => {
                    return R.find(R.propEq('address', address));
                });

                return user.getUserList()
                    .then((list) => storage.save('userList', list.concat(users)))
                    .then(() => {
                        $state.go('welcome');
                    });
            }

            importFromBeta() {
                this.wasImportBeta = true;
                return this._import(WavesApp.betaOrigin);
            }

            importFromOld() {
                this.wasImportOld = true;
                return this._import(OLD_ORIGIN);
            }

            _import(origin) {
                this.pending = true;

                return utils.importAccountByTab(origin, 5000)
                    .catch(() => [])
                    .then(list => {
                        this.pending = false;
                        this.userList = list;
                        $scope.$apply();
                    });
            }

        }

        return new ImportAccountsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'utils', 'user', 'storage', '$state'];

    angular.module('app.utils').controller('ImportAccountsCtrl', controller);
})();
