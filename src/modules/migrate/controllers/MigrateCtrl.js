(() => {
    'use strict';

    const analytics = require('@waves/event-sender');
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
                    const { id } = $state.params;
                    this.activeStep = userList && userList.length ? 0 : 1;
                    this.userListLocked = userList;
                    this.userListUnlocked = multiAccountUsers;

                    const migrateWithoutPass = userList.filter(lockedUser => (
                        lockedUser.userType &&
                        lockedUser.userType !== 'seed' &&
                        lockedUser.userType !== 'privateKey'
                    ));

                    this.migrateUsersWithoutPassword(migrateWithoutPass).then(() => {
                        if (id) {

                            const autoMigrate = migrateWithoutPass.length &&
                                migrateWithoutPass.some(user => multiAccount.hash(user.address) === id);

                            if (autoMigrate) {
                                this.prevStep();
                                return null;
                            }

                            const lockedUserByHash = this.userListLocked.find(lockedUser => (
                                multiAccount.hash(lockedUser.address) === id
                            ));

                            if (lockedUserByHash) {
                                this.startMigrate(lockedUserByHash);
                            }
                        }
                    });
                });
            }

            nextStep() {
                this.activeStep += 1;
            }

            prevStep() {
                const { id } = $state.params;

                if (id) {
                    user.getMultiAccountUsers().then((mUsers = []) => {
                        const userToLogin = mUsers.find(mUser => (
                            multiAccount.hash(mUser.address) === id
                        ));

                        if (userToLogin) {
                            user.login(userToLogin);
                        }

                        $state.go(user.getActiveState('wallet'));
                    });
                } else {
                    this.activeStep -= 1;
                }
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

            checkSeed(seed, publicKey) {
                return publicKey === libs.crypto.publicKey(seed);
            }

            checkPK(privateKey, publicKey) {
                return libs.crypto.publicKey({ privateKey }) === publicKey;
            }

            onSubmit() {
                try {
                    this._hidePasswordError();

                    const { id, publicKey, address, settings = {} } = this.userToMigrate;
                    const encryptionRounds = settings.encryptionRounds || 5000;
                    const userType = userType || 'seed';
                    const networkByte = base58Decode(address)[1];
                    const seed = userType === 'seed' ?
                        ds.Seed.decryptSeedPhrase(
                            this.userToMigrate.encryptedSeed,
                            this.migratePassword,
                            encryptionRounds
                        ) :
                        undefined;
                    const privateKey = userType === 'privateKey' ?
                        ds.Seed.decryptSeedPhrase(
                            this.userToMigrate.encryptedPrivateKey,
                            this.migratePassword
                        ) :
                        undefined;

                    if (seed && !this.checkSeed(seed, publicKey)) {
                        throw new Error('Incorrect seed');
                    }

                    if (privateKey && !this.checkPK(privateKey, publicKey)) {
                        throw new Error('Incorrect private key');
                    }

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
                        analytics.send({ name: 'Successfully Unlocked' });
                    });
                } catch (e) {
                    this._showPasswordError();
                    analytics.send({ name: 'Failed Unlock' });
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
