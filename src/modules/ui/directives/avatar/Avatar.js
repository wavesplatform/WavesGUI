(function () {
    'use strict';

    /**
     *
     * @param $scope
     * @returns {Avatar}
     */
    const controller = function ($q) {

        class Avatar {

            constructor() {
                /**
                 * Avatar size
                 * @type {number}
                 */
                this.size = null;
                /**
                 * Avatar id
                 * @type {string}
                 */
                this.address = null;
                /**
                 * Image (base64)
                 * @type {string}
                 */
                this.src = null;
            }

            $postLink() {
                this.style = { width: `${this.size}px`, height: `${this.size}px` };
            }

            $onChanges() {
                if (!this.size) {
                    this.size = 67;
                }
                if (this.address) {
                    $q((resolve, reject) => {
                        identicon.generate({ id: this.address, size: this.size }, (err, buffer) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(buffer);
                            }
                        });
                    }).then((path) => {
                        this.src = path;
                    });
                }
            }

        }

        return new Avatar();

    };

    controller.$inject = ['$q'];

    angular.module('app.ui').component('wAvatar', {
        bindings: {
            size: '@',
            address: '<'
        },
        controller: controller,
        templateUrl: 'modules/ui/directives/avatar/avatar.html'
    });
})();
