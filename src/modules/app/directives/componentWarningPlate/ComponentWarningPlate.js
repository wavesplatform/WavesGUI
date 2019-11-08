(function () {
    'use strict';

    /**
     * @param {*} $scope
     * @param {ModalManager} modalManager
     * @param {app.utils} utils
     * @param {User} user
     * @param {Storage} storage
     * @return {ComponentWarningPlate}
     */
    const controller = function ($scope, modalManager, utils, user, storage) {

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
            /**
             * @type {boolean}
             */
            hasAccounts = false;
            /**
             * @type {boolean}
             */
            migrationSuccess = false;

            constructor() {
                this._initHasAccounts();
                this._initMigrationSuccess();

                storage.change.on(this._initMigrationSuccess, this);

                utils.startTimer({ year: 2019, month: 12, day: 2, hours: 15 }, this._setTime.bind(this), 1000);
            }

            showMovingModal() {
                modalManager.showMigrateModal();
            }

            /**
             * @param last
             * @private
             */
            _setTime(last) {
                this.days = this._to2Digest(last.days);
                this.hours = this._to2Digest(last.hours);
                this.minutes = this._to2Digest(last.minutes);
            }

            /**
             * @param num
             * @return {string}
             * @private
             */
            _to2Digest(num) {
                return num < 10 ? `0${num}` : String(num);
            }

            /**
             * @private
             */
            _initHasAccounts() {
                Promise.all([
                    user.getFilteredUserList(),
                    user.getMultiAccountData()
                ]).then(([userList, multiAccountData]) => {
                    if (multiAccountData || (userList && userList.length)) {
                        this.hasAccounts = true;
                    } else {
                        this.hasAccounts = false;
                    }
                    $scope.$apply();
                });
            }

            /**
             * @private
             */
            _initMigrationSuccess() {
                storage.load('migrationSuccess').then((migrationSuccess) => {
                    this.migrationSuccess = migrationSuccess;
                    $scope.$apply();
                });
            }

        }

        return new ComponentWarningPlate();

    };

    controller.$inject = ['$scope', 'modalManager', 'utils', 'user', 'storage'];

    angular.module('app').component('wWarningPlate', {
        templateUrl: 'modules/app/directives/componentWarningPlate/componentWarningPlate.html',
        transclude: false,
        controller
    });
})();
