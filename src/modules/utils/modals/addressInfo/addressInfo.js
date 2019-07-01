(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @return {ChangeAddressCtrl}
     */
    const controller = function (Base, $scope, user) {
        const analytics = require('@waves/event-sender');

        class AddressInfoCtrl extends Base {

            /**
             * @public
             * @type {string}
             */
            userName;
            /**
             * @type {string}
             */
            address;
            /**
             * @type {string}
             */
            userType;
            /**
             * @type {boolean}
             */
            isLedger;
            /**
             * @type {boolean}
             */
            isKeeper;

            constructor() {
                super($scope);

                this.userName = user.name;
                this.userType = user.userType;
                this.address = user.address;
                this.isScript = user.hasScript();
                this.isKeeper = user.userType === 'wavesKeeper';
                this.isLedger = user.userType === 'ledger';
                this.hasTypeHelp = this.isScript && (this.isLedger || this.isKeeper);
                analytics.send({ name: 'Account Show', target: 'ui' });
            }

            onCopyAddress() {
                // analytics.push('User', `User.CopyAddress.${WavesApp.type}`);
            }

        }

        return new AddressInfoCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user'];

    angular.module('app.utils')
        .controller('AddressInfoCtrl', controller);
})();
