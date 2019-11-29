(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @param {Waves} waves
     * @return {AccountInfoCtrl}
     */
    const controller = function (Base, $scope, user, waves) {
        const analytics = require('@waves/event-sender');

        class AccountInfoCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {string}
                 */
                this.address = user.address;
                /**
                 * @type {Array<string>}
                 */
                this.aliases = null;
                /**
                 * @type {boolean}
                 */
                this.invalid = false;
                /**
                 * @type {string}
                 */
                this.transactionId = '';
                /**
                 * @type {string}
                 */
                this.userType = user.userType;
                /**
                 * @type {boolean}
                 */
                this.isLedger = user.userType === 'ledger';
                /**
                 * @type {boolean}
                 */
                this.isKeeper = user.userType === 'wavesKeeper';

                this.aliases = waves.node.aliases.getAliasList();
                analytics.send({ name: 'Account Show', target: 'ui' });
            }

            onCopyAddress() {
                // analytics.push('User', `User.CopyAddress.${WavesApp.type}`);
            }

            onCopyAlias() {
                // analytics.push('User', `User.CopyAlias.${WavesApp.type}`);
            }

        }

        return new AccountInfoCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'waves'];

    angular.module('app.utils')
        .controller('AccountInfoCtrl', controller);
})();
