(function () {
    'use strict';

    /**
     *
     * @param $q
     * @return {Avatar}
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
                    $q((resolve) => {
                        resolve(identityImg.create(this.address, { size: this.size * 3 }));
                    })
                        .then((data) => {
                            this.src = data;
                        });
                }
            }

        }

        return new Avatar();

    };

    controller.$inject = ['$q'];

    angular.module('app.ui')
        .component('wAvatar', {
            bindings: {
                size: '@',
                address: '<'
            },
            controller: controller,
            templateUrl: 'modules/ui/directives/avatar/avatar.html'
        });
})();
