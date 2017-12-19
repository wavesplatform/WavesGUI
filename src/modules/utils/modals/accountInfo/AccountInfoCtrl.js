(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {Waves} waves
     * @param {NotificationManager} notificationManager
     * @return {AccountInfoCtrl}
     */
    const controller = function (Base, $scope, user, waves, notificationManager) {

        class AccountInfoCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {string}
                 */
                this.address = user.address;
                /**
                 * @type {number}
                 */
                this.createAliasStep = 0;
                /**
                 * @type {Array<string>}
                 */
                this.aliases = null;
                /**
                 * @type {string}
                 */
                this.newAlias = '';
                /**
                 * @type {Money}
                 */
                this.fee = null;

                waves.node.aliases.fee()
                    .then(([fee]) => {
                        this.fee = fee;
                    });

                waves.node.aliases.getAliasList()
                    .then((aliases) => {
                        this.aliases = aliases;
                    });
            }

            createAlias() {
                return user.getSeed().then((seed) => {
                    return waves.node.aliases.createAlias({ alias: this.newAlias, keyPair: seed.keyPair })
                        .then(() => {
                            this.aliases.push(this.newAlias);
                            this.newAlias = '';
                            this.createAliasStep = 0;
                            notificationManager.info({
                                ns: 'app.utils',
                                title: { literal: 'modal.account.notifications.aliasCreated' }
                            });
                        });
                });
            }

            reset() {
                this.newAlias = '';
            }

        }

        return new AccountInfoCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'waves', 'notificationManager'];

    angular.module('app.utils')
        .controller('AccountInfoCtrl', controller);
})();
