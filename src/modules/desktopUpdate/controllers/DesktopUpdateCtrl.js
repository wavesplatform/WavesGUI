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
     * @param {*} modalManager
     */
    const controller = ($scope,
                        $state,
                        configService,
                        exportStorageService,
                        $log,
                        storage,
                        user,
                        utils,
                        modalManager) => {
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

                // this._export();
            }

            tryExport() {
                const win = window.open('http://localhost:8888');
                setTimeout(() => {
                    const connectProvider = this._getConnectProvider(win);

                    exportStorageService.export({
                        provider: connectProvider,
                        attempts: 1000,
                        timeout: 500
                    });

                    exportStorageService.onData().then(result => {
                        win.close();

                        if (result.payload === 'ok') {
                            $log.log('done');
                            this.state = 'success';
                            $scope.$apply();

                            return storage.save('migrationSuccess', true);
                        } else {
                            win.close();

                            this.state = 'fail';

                            return storage.save('migrationSuccess', false);
                        }
                    });
                });
            }

            _export() {
                const connectProvider = this._getConnectProvider();

                exportStorageService.export({
                    provider: connectProvider,
                    attempts: 100,
                    timeout: 10000
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
                        this._resetProgress();
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
            _getConnectProvider(win) {
                const origins = WavesApp.isProduction() ?
                    WavesApp.network.migration.origins :
                    '*';

                return new ds.connect.PostMessageConnectProvider({
                    win,
                    origins
                });
            }

            _tryAgain() {
                this.state = 'askDownload';
                exportStorageService.destroy();
                // this._export();
            }

            _cancelDownload() {
                this._isCanceled = true;
                this.state = 'askDownload';
                this._resetProgress();
                ds.utils.abortDownloading();
            }

            showFAQ() {
                modalManager.showMigrateFAQ();
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
        'utils',
        'modalManager'
    ];

    angular.module('app.desktopUpdate').controller('DesktopUpdateCtrl', controller);
})();
