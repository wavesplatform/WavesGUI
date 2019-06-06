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
    const controller = function (Base, $scope, utils, user, storage, $state, $mdDialog) {

        const R = require('ramda');

        const OLD_ORIGIN = 'https://localhost:8080';

        class ImportAccountsCtrl extends Base {

            get hasSelected() {
                return Object.values(this.checkedHash).filter(Boolean).length > 0;
            }

            constructor() {
                super($scope);

                this.pending = true;
                this.userList = [];
                this.wasImportBeta = true;
                this.wasImportOld = false;
                this.checkedHash = Object.create(null);
                this._myUserList = [];

                const userListPromise = user.getUserList().catch(() => []);

                userListPromise.then(
                    (userList) => {
                        this._myUserList = userList;
                        return this.importFromOld();
                    }
                );
            }

            importAccounts() {
                const users = Object.keys(this.checkedHash).map((address) => {
                    return R.find(R.propEq('address', address), this.userList);
                });

                return user.getUserList()
                    .then((list) => storage.save('userList', list.concat(users)))
                    .then(() => storage.save('accountImportComplete', true))
                    .then(() => {
                        $mdDialog.hide();
                        $state.go('welcome');
                    });
            }

            importFromOld() {
                this.wasImportOld = true;
                return this._import(OLD_ORIGIN, 'old');
            }

            _import(origin, name) {
                this.pending = true;

                return utils.importAccountByTab(origin, 10000)
                    .catch(() => [])
                    .then(list => {
                        this.pending = false;
                        this._addAccountList({ [name]: list });
                    });
            }

            _addAccountList({ beta, old }) {
                beta = beta || [];
                old = old || [];

                const myUsersHash = utils.toHash(this._myUserList || [], 'address');
                this.userList = R.pipe(
                    R.uniqBy(R.prop('address')),
                    R.filter(user => !myUsersHash[user.address])
                )(beta.concat(old));


                this.checkedHash = Object.create(null);
                this.userList.forEach((user) => {
                    this.checkedHash[user.address] = true;
                });

                $scope.$apply();
            }

        }

        return new ImportAccountsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'utils', 'user', 'storage', '$state', '$mdDialog'];

    angular.module('app.utils').controller('ImportAccountsCtrl', controller);
})();
