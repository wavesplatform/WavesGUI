(() => {
    'use strict';

    const ds = require('data-service');
    const { libs } = require('@waves/waves-transactions');
    const { base58Decode } = libs.crypto;

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {MultiAccount} multiAccount
     * @param {User} user
     * @return {SignUpCtrl}
     */
    const controller = function (Base, $scope, $state, multiAccount, user) {

        class MigrateCtrl extends Base {

            migrateForm = null;
            migratePassword = '';
            activeStep = 0;
            userListLocked = [];
            userListUnlocked = [];
            userToMigrate = null;
            showPasswordError = false;

            constructor() {
                super($scope);

                Promise.all([
                    user.getFilteredUserList(),
                    user.getMultiAccountUsers()
                ]).then(([userList, multiAccountUsers]) => {
                    this.activeStep = userList && userList.length ? 0 : 1;
                    this.userListLocked = userList;
                    this.userListUnlocked = multiAccountUsers;

                    this.migrateUsersWithoutPassword(userList.filter(lockedUser => (
                        lockedUser.userType !== 'seed' &&
                        lockedUser.userType !== 'privateKey'
                    )));
                });
            }

            nextStep() {
                this.activeStep += 1;
            }

            prevStep() {
                this.activeStep -= 1;
            }

            startMigrate(userToMigrate) {
                this.userToMigrate = userToMigrate;
                this.nextStep();
            }

            migrateUser(userData) {
                return multiAccount.addUser(userData)
                    .then(data => Promise.all([
                        user.saveMultiAccount(data),
                        user.migrateUser(this.userToMigrate, data.userHash)
                    ]))
                    .then(() => user.getMultiAccountUsers())
                    .then(multiAccountUsers => {
                        this.userListLocked = this.userListLocked.filter(lockedUser => (
                            lockedUser.userType === this.userToMigrate.userType &&
                            lockedUser.address !== this.userToMigrate.address
                        ));

                        this.userListUnlocked = multiAccountUsers;
                        this.userToMigrate = null;
                    });
            }

            async migrateUsersWithoutPassword(usersWithoutPassword) {
                for (const legacyUser of usersWithoutPassword) {
                    const { userType, id, publicKey, address } = legacyUser;
                    const networkByte = base58Decode(address)[1];

                    this.userToMigrate = legacyUser;

                    // eslint-disable-next-line no-await-in-loop
                    await this.migrateUser({
                        userType,
                        networkByte,
                        id,
                        publicKey
                    });
                }
            }

            onSubmit() {
                try {
                    this._hidePasswordError();

                    const { userType, id, publicKey, address } = this.userToMigrate;
                    const networkByte = base58Decode(address)[1];
                    const seed = userType === 'seed' ?
                        ds.Seed.decryptSeedPhrase(
                            this.userToMigrate.encryptedSeed,
                            this.migratePassword
                        ) :
                        undefined;
                    const privateKey = userType === 'privateKey' ?
                        ds.Seed.decryptSeedPhrase(
                            this.userToMigrate.encryptedPrivateKey,
                            this.migratePassword
                        ) :
                        undefined;

                    this.migrateUser({
                        userType,
                        networkByte,
                        seed,
                        id,
                        privateKey,
                        publicKey
                    }).then(() => {
                        this.migratePassword = '';
                        this.prevStep();
                    });
                } catch (e) {
                    this._showPasswordError();
                }
            }

            finish() {
                const [firstUser] = this.userListUnlocked;

                user.login(firstUser).then(() => {
                    $state.go(user.getActiveState('wallet'));
                });
            }

            _showPasswordError() {
                this.migratePassword = '';
                this.showPasswordError = true;
            }

            _hidePasswordError() {
                this.showPasswordError = false;
            }

        }

        return new MigrateCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'multiAccount', 'user'];

    angular.module('app.migrate').controller('MigrateCtrl', controller);
})();
