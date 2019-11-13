(() => {
    'use strict';

    const ds = require('data-service');
    const STATES = [
        'askDownload',
        'downloading',
        'installAndRun',
        'success',
        'fail'
    ];

    /**
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {*} configService
     */
    const controller = ($scope, $state, configService, exportStorageService, $log, storage, user) => {
        class DesktopUpdateCtrl {

            /**
             * @type {'askDownload' | 'downloading' | 'installAndRun' | 'success' | 'fail' }
             */
            state = 'askDownload';
            progress = 0;
            error = null;
            isDownloading = false;

            constructor() {
                if (!WavesApp.isDesktop()) {
                    $state.go(user.getActiveState('wallet'));
                }

                const connectProvider = this._getConnectProvider();

                exportStorageService.export({
                    provider: connectProvider,
                    attempts: 10,
                    timeout: 1000
                });

                exportStorageService.onData().then(result => {
                    if (result.payload === 'ok') {
                        $log.log('done');
                        this.state = 'success';
                        $scope.$apply();

                        return storage.save('migrationSuccess', true);
                    } else {
                        this.state = 'fail';

                        return storage.save('migrationSuccess', false);
                    }
                });
            }

            download() {
                const url = this._getDistUrl();
                const [fileName] = url.pathname.split('/').slice(-1);

                this.isDownloading = true;
                this.state = 'downloading';

                ds.utils.downloadFile(url, (progress) => {
                    this.progress = Math.ceil(progress);
                    $scope.$digest();
                }).then((content) => {
                    transfer('download', {
                        fileName,
                        fileContent: content
                    }).then(() => {
                        this.state = 'installAndRun';
                        this.isDownloading = false;
                        $scope.$digest();
                    }).catch((e) => {
                        if (e.message === 'Cancel') {
                            this._resetProgress();
                        } else {
                            this.error = String(e);
                        }

                        this.isDownloading = false;
                        $scope.$digest();
                    });
                }).catch((e) => {
                    console.log('%c e', 'color: #e5b6ed', e);
                    this.error = String(e);
                    $scope.$digest();
                });
            }

            _getDistUrl() {
                const urls = configService.get('DESKTOP_URLS');

                return new URL(urls[WavesApp.platform]);
            }

            _resetProgress() {
                this.progress = 0;
            }

            _toHome() {
                $state.go(user.getActiveState('wallet'));
            }

            /**
             * @returns {ConnectProvider}
             */
            _getConnectProvider() {
                const origins = WavesApp.isProduction() ?
                    WavesApp.network.migrationOrigins :
                    '*';

                return new ds.connect.HttpConnectProvider({
                    port: WavesApp.network.migration.desktopPort,
                    url: WavesApp.network.migration.desktopUrl,
                    origins
                });
            }

        }

        return new DesktopUpdateCtrl();
    };

    controller.$inject = ['$scope', '$state', 'configService', 'exportStorageService', '$log' , 'storage', 'user'];

    angular.module('app.desktopUpdate').controller('DesktopUpdateCtrl', controller);
})();
