(() => {
    'use strict';

    const ds = require('data-service');

    /**
     * @param {ng.IScope} $scope
     * @param {*} exportStorageService
     * @param {$log} $log
     * @param {Storage} storage
     * @param {User} user
     * @param {*} utils
     * @param {*} $state
     * @param {*} configService
     */
    const controller = ($scope, $state, configService, exportStorageService, $log, storage, user, utils) => {
        class DesktopUpdateCtrl {

            /**
             * @type {'askDownload' | 'downloading' | 'installAndRun' | 'success' | 'fail' }
             */
            state = 'askDownload';
            progress = 0;
            error = null;
            isDownloading = false;
            _oldDesktop = false;
            _hasAccounts = false;
            _isCanceled = null;

            constructor() {
                if (!WavesApp.isDesktop()) {
                    $state.go(user.getActiveState('wallet'));
                }

                this._oldDesktop = utils.isVersionLte('1.4.0');
                this._showMoving = !this._oldDesktop;

                storage.load('userList').then(list => {
                    if (list && list.length > 0) {
                        this._hasAccounts = true;
                    }
                });

                this._export();
            }

            _export() {
                const connectProvider = this._getConnectProvider();

                exportStorageService.export({
                    provider: connectProvider,
                    attempts: 50,
                    timeout: 20000
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
                this._isCanceled = false;
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
                            this.state = 'askDownload';
                            this._resetProgress();
                        } else {
                            this.error = String(e);
                        }

                        this.isDownloading = false;
                        $scope.$digest();
                    });
                }).catch((e) => {
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

            _toMigration() {
                this._showMoving = true;
            }

            /**
             * @returns {ConnectProvider}
             */
            _getConnectProvider() {
                const origins = WavesApp.isProduction() ?
                    WavesApp.network.migration.origins :
                    '*';

                return new ds.connect.HttpConnectProvider({
                    port: WavesApp.network.migration.desktopPort,
                    url: WavesApp.network.migration.desktopUrl,
                    origins
                });
            }

            _tryAgain() {
                this.state = 'askDownload';
                exportStorageService.destroy();
                this._export();
            }

            _cancelDownload() {
                this._isCanceled = true;
                this.state = 'askDownload';
                this._resetProgress();
                ds.utils.abortDownloading();
                $scope.$digest();
            }

        }

        return new DesktopUpdateCtrl();
    };

    controller.$inject = [
        '$scope',
        '$state',
        'configService',
        'exportStorageService',
        '$log',
        'storage',
        'user',
        'utils'
    ];

    angular.module('app.desktopUpdate').controller('DesktopUpdateCtrl', controller);
})();
