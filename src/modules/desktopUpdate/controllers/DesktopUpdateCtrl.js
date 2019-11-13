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
    const controller = ($scope, $state, configService) => {
        class DesktopUpdateCtrl {

            state = 'askDownload';
            progress = 0;
            error = null;
            isDownloading = false;

            constructor() {
                if (!WavesApp.isDesktop()) {
                    $state.go('/');
                }
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
                        // @TODO вернуть
                        // this.state = 'installAndRun';
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

            _toWelcome() {
                $state.go('welcome');
            }

        }

        return new DesktopUpdateCtrl();
    };

    controller.$inject = ['$scope', '$state', 'configService'];

    angular.module('app.desktopUpdate').controller('DesktopUpdateCtrl', controller);
})();
