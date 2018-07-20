(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {app.utils} utils
     * @param modalManager
     * @return {RestoreCtrl}
     */
    const controller = function (Base, $scope, user) {

        const R = require('ramda');

        class RestoreCtrl extends Base {

            get user() {
                return R.find(R.propEq('address', this.activeUserAddress), this.userList);
            }

            constructor() {
                super($scope);

                /**
                 * @type {string}
                 */
                this.activeUserAddress = null;
                /**
                 * @type {string}
                 */
                this.seed = '';
                /**
                 * @type {string}
                 */
                this.password = '';
                /**
                 * @type {number}
                 */
                this.activeStep = 0;
                /**
                 * @type {Array}
                 */
                this.userList = [];

                user.getUserList()
                    .then((list) => {
                        this.userList = list;
                        $scope.$apply();
                    });
            }

            login() {

                try {
                    this.showPasswordError = false;
                    const activeUser = this.user;
                    const encryptionRounds = user.getSettingByUser(activeUser, 'encryptionRounds');
                    this.seed = ds.Seed.decryptSeedPhrase(activeUser.encryptedSeed, this.password, encryptionRounds);

                    this.activeStep++;
                    this.password = '';
                } catch (e) {
                    this.password = '';
                    this.showPasswordError = true;
                }

            }

        }

        return new RestoreCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user'];

    angular.module('app.restore').controller('RestoreCtrl', controller);
})();
