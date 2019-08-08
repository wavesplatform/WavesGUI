(function () {
    'use strict';

    /**
     * @return {confirmDeleteUserCtrl}
     */
    const controller = function () {

        class confirmDeleteUserCtrl {

            constructor(locals) {
                this.hasBackup = locals.user.settings.hasBackup;
                this.isSeed = !locals.user.userType || locals.user.userType === 'seed';
                this.isLedger = locals.user.userType === 'ledger';
                this.isKeeper = locals.user.userType === 'wavesKeeper';
                this.isPrivateKey = locals.user.userType === 'privateKey';
            }

        }

        return new confirmDeleteUserCtrl(this.locals);
    };

    controller.$inject = [];

    angular.module('app.ui').controller('confirmDeleteUserCtrl', controller);
})();
