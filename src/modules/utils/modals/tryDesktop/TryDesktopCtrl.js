(function () {
    'use strict';

    const locationHref = location.href;

    const controller = function (Base, $scope, storage, $element) {

        class TryDesktopCtrl extends Base {

            constructor() {
                super($scope);

                /**
                 * @type {boolean}
                 */
                this.save = false;
                const url = new URL(locationHref);
                const href = `waves://${url.pathname}${url.search}${url.hash}`.replace('///', '//');

                $element.find('a').attr('href', href);
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

    controller.$inject = ['Base', '$scope', 'storage', '$element'];

    angular.module('app.utils').controller('TryDesktopCtrl', controller);
})();
