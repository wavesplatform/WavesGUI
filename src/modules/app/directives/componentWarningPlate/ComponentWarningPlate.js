(function () {
    'use strict';

    /**
     * @param {ModalManager} modalManager
     * @param {app.utils} utils
     * @return {ComponentWarningPlate}
     */
    const controller = function (modalManager, utils) {

        class ComponentWarningPlate {

            /**
             * @type {number}
             */
            days = 0;
            /**
             * @type {number}
             */
            hours = 0;
            /**
             * @type {number}
             */
            minutes = 0;

            constructor() {
                utils.startTimer({ year: 2019, month: 12, day: 2, hours: 15 }, this._setTime.bind(this), 1000);
            }

            showMovingModal() {
                modalManager.showMigrateModal();
            }

            _setTime(last) {
                this.days = this._to2Digest(last.days);
                this.hours = this._to2Digest(last.hours);
                this.minutes = this._to2Digest(last.minutes);
            }

            _to2Digest(num) {
                return num < 10 ? `0${num}` : String(num);
            }

        }

        return new ComponentWarningPlate();

    };

    controller.$inject = ['modalManager', 'utils'];

    angular.module('app').component('wWarningPlate', {
        templateUrl: 'modules/app/directives/componentWarningPlate/componentWarningPlate.html',
        transclude: false,
        controller
    });
})();
