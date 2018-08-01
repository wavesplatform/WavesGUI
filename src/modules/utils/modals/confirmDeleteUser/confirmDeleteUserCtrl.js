(function () {
    'use strict';

    /**
     * @return {confirmDeleteUserCtrl}
     */
    const controller = function () {

        class confirmDeleteUserCtrl {

            constructor(locals) {
                this.hasBackup = locals.hasBackup;
            }

        }

        return new confirmDeleteUserCtrl(this.locals);
    };

    controller.$inject = [];

    angular.module('app.ui').controller('confirmDeleteUserCtrl', controller);
})();
