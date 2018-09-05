(function () {
    'use strict';

    /**
     * @return {confirmDeleteUserCtrl}
     */
    const controller = function () {

        class confirmDeleteUserCtrl {

            constructor(locals) {
                this.hasBackup = locals.user.settings.hasBackup;
                this.isLedger = locals.user.userType === 'ledger';
                this.isSeed = !locals.user.userType || locals.user.userType === 'seed';
            }

        }

        return new confirmDeleteUserCtrl(this.locals);
    };

    controller.$inject = [];

    angular.module('app.ui').controller('confirmDeleteUserCtrl', controller);
})();
