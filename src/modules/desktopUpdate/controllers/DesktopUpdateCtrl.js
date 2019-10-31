(() => {
    'use strict';

    const ds = require('data-service');

    /**
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {*} configService
     */
    const controller = ($scope, $state, configService) => {
        class DesktopUpdateCtrl {

            step = 0;
            progress = 0;
            error = null;

            constructor() {
                if (!WavesApp.isDesktop()) {
                    $state.go('/');
                }
            }

            download() {
                const url = this._getDistUrl();
                const [fileName] = url.pathname.split('/').slice(-1);

                ds.utils.downloadFile(url, (progress) => {
                    this.progress = Math.ceil(progress);
                    $scope.$digest();
                }).then((content) => {
                    transfer('download', {
                        fileName,
                        fileContent: content
                    }).then(() => {
                        this._nextStep();
                        $scope.$digest();
                    }).catch((e) => {
                        if (e.message === 'Cancel') {
                            this._resetProgress();
                        } else {
                            this.error = String(e);
                        }

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

            _nextStep() {
                this.step = this.step + 1;
            }

            _resetProgress() {
                this.progress = 0;
            }

        }

        return new DesktopUpdateCtrl();
    };

    controller.$inject = ['$scope', '$state', 'configService'];

    angular.module('app.desktopUpdate').controller('DesktopUpdateCtrl', controller);
})();
