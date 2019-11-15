(() => {
    'use strict';

    const ds = require('data-service');

    /**
     * @param {*} Base
     * @param {ng.ILogService} $log
     * @param {*} $mdDialog
     * @param {*} storageExporter
     * @param {*} exportStorageService
     * @param {*} $state
     * @param {*} $scope
     * @param {*} storage
     */

    const controller = function (Base,
                                 $log,
                                 $mdDialog,
                                 storageExporter,
                                 $state,
                                 $scope,
                                 storage,
                                 exportStorageService) {

        class MigrateModalCtrl extends Base {

            /**
             * @type {number}
             */
            step = 0;

            moving() {
                if (WavesApp.isDesktop()) {
                    $state.go('desktopUpdate');
                } else {
                    this._export();
                }
            }

            _export() {
                const connectProvider = this._getConnectProvider();

                exportStorageService.export({
                    provider: connectProvider,
                    attempts: 3,
                    timeout: 3000
                });

                exportStorageService.onData().then(result => {
                    if (result.payload === 'ok') {
                        $log.log('done');
                        this.step++;
                        $scope.$apply();

                        return storage.save('migrationSuccess', true);
                    } else {
                        $log.log('fail', result);

                        return storage.save('migrationSuccess', false);
                    }
                });
            }

            cancel() {
                $mdDialog.cancel();
                storage.save('notAutoOpenMigrationModal', true);
            }

            /**
             * @returns {ConnectProvider}
             */
            _getConnectProvider() {
                const origins = WavesApp.isProduction() ?
                    WavesApp.network.migration.origins :
                    '*';

                const childWindow = window.open(WavesApp.network.migration.webUrl);

                return new ds.connect.PostMessageConnectProvider({
                    win: childWindow,
                    mode: 'export',
                    origins
                });
            }

        }

        return new MigrateModalCtrl();
    };

    controller.$inject = [
        'Base',
        '$log',
        '$mdDialog',
        'storageExporter',
        '$state',
        '$scope',
        'storage',
        'exportStorageService'
    ];

    angular.module('app.utils').controller('MigrateModalCtrl', controller);
})();
