(() => {
    'use strict';

    const ds = require('data-service');

    /**
     * @param {ng.IScope} $scope
     * @param {*} exportStorageService
     * @param {ng.ILogService} $log
     * @param {Storage} storage
     * @param {User} user
     * @param {*} utils
     * @param {*} $state
     * @param {*} configService
     * @param {*} modalManager
     * @param {*} multiAccount
     */
    const controller = (
        $scope,
        $state,
        configService,
        exportStorageService,
        $log,
        storage,
        user,
        utils,
        modalManager,
        multiAccount
    ) => {
        class DesktopUpdateCtrl {

            /**
             * @type {'askDownload' | 'downloading' | 'installAndRun' | 'success' | 'fail' }
             */
            state = 'askDownload';
            progress = 0;
            error = null;
            isDownloading = false;
            multiAccountData = null;
            multiAccountHash = null;
            hasMultiAccount = false;
            signInForm = null;
            password = '';
            showPasswordError = false;
            isOldDesktop = false;
            hasUserList = false;
            _isCanceled = null;
            _showSteps = false;
            _timer = 10;
            downloadDone = false;

            constructor() {
                if (!WavesApp.isDesktop()) {
                    $state.go(user.getActiveState('wallet'));
                }

                this.isOldDesktop = utils.isVersionLte('1.4.0');
                this._showMoving = !this.isOldDesktop;

                storage.load('userList').then(list => {
                    if (list && list.length > 0) {
                        this.hasUserList = true;
                    }
                });

                Promise.all([
                    user.getMultiAccountData(),
                    user.getMultiAccountHash()
                ]).then(([multiAccountData, multiAccountHash]) => {
                    this.multiAccountData = multiAccountData;
                    this.multiAccountHash = multiAccountHash;
                    this.hasMultiAccount = !!multiAccountData;
                });
            }

            tryExport() {
                const win = window.open('http://localhost:8888');
                setTimeout(() => {
                    window.addEventListener('message', event => {
                        if (event.data && event.data.migrationError != null) {
                            if (event.data.migrationError) {
                                win.close();
                                this.state = 'fail';
                                return storage.save('migrationSuccess', false);
                            } else {
                                const connectProvider = this._getConnectProvider(win);

                                exportStorageService.export({
                                    provider: connectProvider,
                                    attempts: 1000,
                                    timeout: 1500
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
                            }
                        }
                    });
                    const content = '{migrationError: !window.location.href.includes(\'http://localhost:8888\') }';
                    win.eval(`window.opener.postMessage(${content}, '*')`);
                });
            }

            signInAndExport() {
                if (this.signInForm.$invalid) {
                    return;
                }

                this.showPasswordError = false;

                multiAccount.signIn(
                    this.multiAccountData,
                    this.password,
                    undefined,
                    this.multiAccountHash
                ).then(() => {
                    this.toMigration();
                }).catch(() => {
                    this.password = '';
                    this.showPasswordError = true;
                });
            }

            onPasswordChange() {
                this.showPasswordError = false;
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
                        this._toInstallAndRun();
                        this.isDownloading = false;
                        this.downloadDone = true;
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
                        this.downloadDone = false;
                        $scope.$digest();
                    });
                }).catch((e) => {
                    this.error = String(e);
                    this.downloaded = false;
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

            toHome() {
                $state.go(user.getActiveState('wallet'));
            }

            toMigration() {
                this._showMoving = true;
            }

            _toInstallAndRun() {
                this.state = 'installAndRun';
                this._timer = 10;

                let timerId;

                const tick = () => {
                    if (this._timer > 0) {
                        this._decreaseTimer();
                        if (timerId) {
                            window.clearTimeout(timerId);
                        }
                        timerId = setTimeout(tick, 1000);
                    } else {
                        window.clearTimeout(timerId);
                    }
                };

                tick();


                const otherTimer = setTimeout(() => {
                    this._showSteps = true;
                    window.clearInterval(otherTimer);
                }, 10);

            }

            _askDownload() {
                this.state = 'askDownload';
                this._showSteps = false;
            }

            /**
             * @returns {ConnectProvider}
             */
            _getConnectProvider(win) {
                const origins = '*';

                return new ds.connect.PostMessageConnectProvider({
                    win,
                    origins
                });
            }

            tryAgain() {
                this.state = 'askDownload';
                this._showSteps = false;
                this._timer = 10;
                exportStorageService.destroy();
            }

            cancelDownload() {
                this._isCanceled = true;
                this.state = 'askDownload';
                this._resetProgress();
                this.downloadDone = false;
                ds.utils.abortDownloading();
            }

            showFAQ() {
                modalManager.showMigrateFAQ();
            }

            _decreaseTimer() {
                this._timer = this._timer - 1;
            }

            // @TODO сделать плюризацию
            getPlural() {
                switch (this._timer) {
                    case 1:
                        return 'desktopUpdate.seconds1';
                    case 2:
                    case 3:
                    case 4:
                        return 'desktopUpdate.seconds234';
                    default:
                        return 'desktopUpdate.seconds';
                }
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
        'modalManager',
        'multiAccount'
    ];

    angular.module('app.desktopUpdate').controller('DesktopUpdateCtrl', controller);
})();
