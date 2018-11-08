(function () {
    'use strict';


    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @return {KeeperCtrl}
     */
    const controller = function (Base, $scope, user) {

        const signatureAdapter = require('@waves/signature-adapter');

        class KeeperCtrl extends Base {

            /**
             * @type {boolean}
             */
            isInit = false;
            /**
             * @type {boolean}
             */
            noKeeper = false;
            /**
             * @type {boolean}
             */
            noKeeperPermission = false;
            /**
             * @type {boolean}
             */
            noKeeperAccounts = false;
            /**
             * @type {boolean}
             */
            incorrectKeeperNetwork = false;
            /**
             * @type {WavesKeeperAdapter}
             */
            adapter = signatureAdapter.WavesKeeperAdapter;
            /**
             * @type {boolean}
             */
            loading = false;
            /**
             * @type {boolean}
             */
            error = false;
            /**
             * @type {user}
             */
            selectedUser = null;
            /**
             * @type {boolean}
             */
            saveUserData = true;
            /**
             * @type {string}
             */
            name = '';

            constructor() {
                super($scope);
                this.getUsers();
            }

            /**
             * @return {Promise<boolean>}
             */
            isAvilableAdapter() {
                return this.adapter.isAvailable();
            }

            onError(error) {

                const { code } = error;
                this.noKeeper = false;
                this.noKeeperPermission = false;
                this.noKeeperAccounts = false;
                this.incorrectKeeperNetwork = false;

                switch (code) {
                    case 0:
                        this.noKeeper = true;
                        break;
                    case 1:
                        this.noKeeperPermission = true;
                        break;
                    case 2:
                        this.noKeeperAccounts = true;
                        break;
                    case 3:
                        this.incorrectKeeperNetwork = true;
                        break;
                    default:
                }

                this.error = true;
            }

            /**
             * @return {void}
             */
            getUsers() {
                this.loading = true;
                this.error = false;

                this.isAvilableAdapter()
                    .then(() => this.adapter.getUserList())
                    .then(([user]) => {
                        this.selectedUser = user;
                        delete this.selectedUser.type;
                    })
                    .catch((e) => this.onError(e))
                    .finally(() => {
                        this.isInit = true;
                        this.loading = false;
                        $scope.$apply();
                    });
            }

            /**
             * @return {void}
             */
            login() {
                const userSettings = user.getDefaultUserSettings({ termsAccepted: false });

                const newUser = {
                    ...this.selectedUser,
                    userType: this.adapter.type,
                    settings: userSettings,
                    saveToStorage: this.saveUserData
                };

                const api = ds.signature.getDefaultSignatureApi(newUser);

                return user.create({
                    ...newUser,
                    settings: userSettings.getSettings(),
                    api
                }, true, true).catch(() => {
                    this.error = true;
                    $scope.$digest();
                });
            }

        }

        return new KeeperCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user'];

    angular.module('app.keeper').controller('KeeperCtrl', controller);
})();
