(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {User} user
     * @param {$mdDialog} $mdDialog
     * @param {Storage} storage
     * @param {*} $state
     * @returns {ImportAccountsCtrl}
     */
    const controller = function (Base, $scope, utils, user, storage, $state, $mdDialog) {

        const { find, propEq, uniqBy, filter, pipe, prop } = require('ramda');
        const { isValidAddress } = require('@waves/signature-adapter');

        const OLD_ORIGIN = 'https://client.wavesplatform.com';

        class ImportAccountsCtrl extends Base {

            get hasSelected() {
                return Object.values(this.checkedHash).filter(Boolean).length > 0;
            }

            constructor() {
                super($scope);

                this.pending = true;
                this.userList = [];
                this.wasImportOld = false;
                this.checkedHash = Object.create(null);
                this._myUserList = [];

                user.getFilteredUserList()
                    .catch(() => [])
                    .then((userList) => {
                        this._myUserList = userList;
                        return this.importFromOld();
                    });
            }

            /**
             * @public
             * @return {Promise<T | never>}
             */
            importAccounts() {
                const users = Object.keys(this.checkedHash)
                    .filter(address => this.checkedHash[address])
                    .map((address) => {
                        return find(propEq('address', address), this.userList);
                    });

                return user.getFilteredUserList()
                    .then((list) => storage.save('userList', list.concat(users)))
                    .then(() => storage.save('accountImportComplete', true))
                    .then(() => {
                        $mdDialog.hide();
                        $state.go('welcome');
                    });
            }

            importFromOld() {
                this.wasImportOld = true;
                return this._import(OLD_ORIGIN);
            }

            _import(origin) {
                return utils.importAccountByTab(origin, 5000)
                    .catch(() => [])
                    .then(list => {
                        this.pending = false;
                        const networkByte = WavesApp.network.code.charCodeAt(0);
                        const filteredList = list.filter(user => isValidAddress(user.address, networkByte));
                        this._addAccountList(filteredList);
                    });
            }

            _addAccountList(list) {
                const myUsersHash = utils.toHash(this._myUserList || [], 'address');
                this.userList = pipe(
                    uniqBy(prop('address')),
                    filter(user => !myUsersHash[user.address])
                )(list).reverse();

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
