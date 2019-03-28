/* eslint-disable max-len */
(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @return {StandCtrl}
     */
    const controller = function (Base, $scope) {

        class StandCtrl extends Base {

            constructor() {

                super($scope);

                const seed = "merry evil keep lost fox tech absent trololo both field get input div cosmic"
                /**
                 * @type {string}
                 */
                this.tab = 'info';
                this.qrData = 'Keep on waving, we\`ll take care of the bad guys'
                /**
                 * @type {boolean}
                 */
                this.invalid = true;
                this.warning = true;
                this.success = true;
                this.error = true;
                this.active = true;
                this.inactive = true;
                this.seedConfirmWasFilled = false;
                this.seedIsValid = false;
                /**
                 * @type {string}
                 */
                this.seed = seed;
                // this.observeOnce('form', () => {
                //     this.form.invalid.$setTouched(true);
                // });
            }

        }

        return new StandCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.stand').controller('StandCtrl', controller);
})();
