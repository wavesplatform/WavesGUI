(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @param {Waves} waves
     * @param {INotification} notification
     * @return {AccountInfoCtrl}
     */
    const controller = function (Base, $scope, user, waves, notification) {

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

                waves.node.getFee({ type: WavesApp.TRANSACTION_TYPES.NODE.CREATE_ALIAS })
                    .then((fee) => {
                        this.fee = fee;
                        $scope.$digest();
                    });

                this.aliases = waves.node.aliases.getAliasList();
            }

            createAlias() {
                return user.getSeed().then((seed) => {
                    return waves.node.aliases.createAlias({ alias: this.newAlias, keyPair: seed.keyPair })
                        .then(() => {
                            analytics.push('User', 'User.CreateAlias.Success');
                            this.aliases.push(this.newAlias);
                            this.newAlias = '';
                            this.createAliasStep = 0;
                            notification.info({
                                ns: 'app.utils',
                                title: { literal: 'modal.account.notifications.aliasCreated' }
                            });
                            $scope.$digest();
                        })
                        .catch(() => {
                            analytics.push('User', 'User.CreateAlias.Error');
                        });
                });
            }

            onCopyAddress() {
                analytics.push('User', 'User.CopyAddress');
            }

            onCopyAlias() {
                analytics.push('User', 'User.CopyAlias');
            }

            reset() {
                this.newAlias = '';
            }

        }

        return new AccountInfoCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'waves', 'notification'];

    angular.module('app.utils')
        .controller('AccountInfoCtrl', controller);
})();
