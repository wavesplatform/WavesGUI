(function () {
    'use strict';

    const controller = function (Base, $scope, storage) {

        class TryDesktopCtrl extends Base {

            constructor() {
                super($scope);

                /**
                 * @type {boolean}
                 */
                this.save = false;
            }

            tryWeb() {
                this._saveChoice('web');
            }

            tryDesktop() {
                this._saveChoice('desktop');
            }

            _saveChoice(mode) {
                if (this.save) {
                    storage.save('openClientMode', mode);
                }
            }

        }

        return new TryDesktopCtrl();
    };

    controller.$inject = ['Base', '$scope', 'storage'];

    angular.module('app.utils').controller('TryDesktopCtrl', controller);
})();
