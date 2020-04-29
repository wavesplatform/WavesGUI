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
     * @param {Base} Base
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
        multiAccount,
        Base
    ) => {
        class DesktopUpdateCtrl extends Base {

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
            hasUserList = false;
            _isCanceled = null;
            _showSteps = false;
            _timer = 10;
            downloadDone = false;
            hasAccount = false;

            constructor() {
                super();
                if (!WavesApp.isDesktop()) {
                    $state.go(user.getActiveState('wallet'));
                }

                Promise.all([
                    user.getMultiAccountData(),
                    user.getMultiAccountHash(),
                    user.getFilteredUserList()
                ]).then(([multiAccountData, multiAccountHash, userList]) => {
                    this.multiAccountData = multiAccountData;
                    this.multiAccountHash = multiAccountHash;
                    this.hasMultiAccount = !!multiAccountData;
                    if (userList && userList.length > 0) {
                        this.hasUserList = true;
                    }
                    this.hasAccount = this.hasMultiAccount || this.hasUserList;

                    if (!this.hasAccount) {
                        this.download();
                        this.observe('state', () => {
                            if (this.state !== 'downloading') {
                                $state.go('welcome');
                            }
                        });
                    }
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
                                    timeout: 6000
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
                ).catch(() => {
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
                $state.go('welcome');
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

            cancelDownloadAndGoWelcome() {
                this.cancelDownload();
                $state.go('welcome');
            }

            showFAQ() {
                modalManager.showMigrateFAQ();
            }

            _decreaseTimer() {
                this._timer = this._timer - 1;
                $scope.$apply();
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
        'multiAccount',
        'Base'
    ];

    angular.module('app.desktopUpdate').controller('DesktopUpdateCtrl', controller);
})();
