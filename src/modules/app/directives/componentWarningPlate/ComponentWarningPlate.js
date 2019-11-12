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
    const controller = function ($scope, modalManager, utils, user, storage, configService) {

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
            canMoveAccounts = false;
            /**
             * @type {boolean}
             */
            migrationSuccess = false;
            /**
             * @type {string}
             */
            newDexLink = WavesApp.network.wavesExchangeLink;
            isDesktop = WavesApp.isDesktop();

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
                
                this._getDistUrl();
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
            _initCanMoveAccounts() {
                Promise.all([
                    user.getFilteredUserList(),
                    user.getMultiAccountData()
                ]).then(([userList, multiAccountData]) => {
                    if ((multiAccountData && user.isAuthorised) || (userList && userList.length)) {
                        this.canMoveAccounts = true;
                    } else {
                        this.canMoveAccounts = false;
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
            _getDistUrl() {
                configService.configReadyPromise.then(() => {
                    const urls = configService.get('DESKTOP_URLS');
                    this.distUrl = new URL(urls[WavesApp.platform]);
                });
            }

        }

        return new ComponentWarningPlate();

    };

    controller.$inject = ['$scope', 'modalManager', 'utils', 'user', 'storage', 'configService'];

    angular.module('app').component('wWarningPlate', {
        templateUrl: 'modules/app/directives/componentWarningPlate/componentWarningPlate.html',
        transclude: false,
        controller
    });
})();
