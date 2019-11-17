(function () {
    'use strict';

    /**
     * @param {*} $scope
     * @param {*} $transitions
     * @param {ModalManager} modalManager
     * @param {app.utils} utils
     * @param {User} user
     * @param {Storage} storage
     * @param {ng.IAugmentedJQuery} $element
     * @return {ComponentWarningPlate}
     */
    const controller = function ($scope, $transitions, modalManager, utils, user, storage, $element) {

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
             * @type {number}
             */
            seconds = 0;
            /**
             * @type {boolean}
             */
            canMoveAccounts = false;
            /**
             * @type {boolean}
             */
            migrationSuccess = false;
            /**
             * @type {string}
             */
            newDexLink = WavesApp.network.wavesExchangeLink;
            /**
             * @type {boolean}
             */
            isDesktop = WavesApp.isDesktop();
            /**
             * @type {boolean}
             */
            isOldDesktop = this.isDesktop && utils.isVersionLte('1.4.0');
            /**
             * @type {boolean}
             */
            isVisible = true;

            constructor() {
                this._initCanMoveAccounts();
                this._initMigrationSuccess();

                storage.change.on(() => {
                    this._initMigrationSuccess();
                    this._initCanMoveAccounts();
                });

                user.loginSignal.on(this._initCanMoveAccounts, this);
                user.logoutSignal.on(this._initCanMoveAccounts, this);

                utils.startTimer({ year: 2019, month: 12, day: 2, hours: 15 }, this._setTime.bind(this), 1000);

                $transitions.onSuccess({ to: 'desktopUpdate' }, () => {
                    this.isVisible = false;
                });

                $transitions.onSuccess({ from: 'desktopUpdate' }, () => {
                    this.isVisible = true;
                });
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
                this.seconds = this._to2Digest(last.seconds);
                utils.safeApply($scope);
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
            _initCanMoveAccounts() {
                Promise.all([
                    user.getFilteredUserList(),
                    user.getMultiAccountData()
                ]).then(([userList, multiAccountData]) => {
                    if (
                        (multiAccountData && user.isAuthorised) ||
                        (userList && userList.length && !multiAccountData)
                    ) {
                        this.canMoveAccounts = true;
                    } else {
                        this.canMoveAccounts = false;
                    }
                    $element.toggleClass('warning-timer_active', this.canMoveAccounts);
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

    controller.$inject = ['$scope', '$transitions', 'modalManager', 'utils', 'user', 'storage', '$element'];

    angular.module('app').component('wWarningPlate', {
        templateUrl: 'modules/app/directives/componentWarningPlate/componentWarningPlate.html',
        transclude: false,
        controller
    });
})();
