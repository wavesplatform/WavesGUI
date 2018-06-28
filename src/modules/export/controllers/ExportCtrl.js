(function () {
    'use strict';

    const controller = function (Base, $scope, storage) {

        class ExportCtrl extends Base {

            constructor() {
                super($scope);

                window.addEventListener('message', (event) => {
                    if (event.origin === WavesApp.targetOrigin || event.origin === WavesApp.betaOrigin) {
                        this._onMessage(event.data);
                    }
                }, false);
            }

            _onMessage(data) {
                if (data.type === 'action' && data.name === 'getStorageData') {
                    storage.load('userList')
                        .then((list) => {
                            const message = {
                                type: 'response',
                                content: list
                            };
                            window.parent.postMessage(message, WavesApp.targetOrigin);
                        });
                }
            }

        }

        return new ExportCtrl();
    };

    controller.$inject = ['Base', '$scope', 'storage'];

    angular.module('app.export').controller('ExportCtrl', controller);
})();
