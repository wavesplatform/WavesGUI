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

        const analytics = require('@waves/event-sender');

        class MigrateModalCtrl extends Base {

            /**
             * @type {number}
             */
            step = 0;

            moving() {
                analytics.send({
                    name: 'Start migration',
                    target: 'all'
                });

                if (WavesApp.isDesktop()) {
                    $state.go('desktopUpdate');
                } else {
                    this._export();
                }
            }

            _export() {
                const connectProvider = this._getConnectProvider();

                this.step = this.step + 1;

                exportStorageService.export({
                    provider: connectProvider,
                    attempts: 20,
                    timeout: 2000
                });

                exportStorageService.onData().then(result => {
                    if (result.payload === 'ok') {
                        this.step = this.step + 1;
                        $log.log('done');
                        $scope.$apply();

                        analytics.send({
                            name: 'End migration',
                            target: 'all'
                        });

                        return storage.save('migrationSuccess', true);
                    } else {
                        analytics.send({
                            name: 'Bad migration',
                            target: 'all'
                        });

                        this.step = this.step - 1;
                        $log.log('fail', result);
                        $scope.$apply();

                        return storage.save('migrationSuccess', false);
                    }
                });
            }

            cancel() {
                analytics.send({
                    name: 'Cancel migration',
                    target: 'all'
                });
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
