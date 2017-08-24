(function () {
    'use strict';

    /**
     *
     * @param $scope
     * @param {AddressGenerator} addressGenerator
     * @returns {Avatar}
     */
    const controller = function ($scope, addressGenerator) {

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
                if (!this.size) {
                    this.size = 67;
                }
            }

            $onChanges() {
                if (this.address) {
                    addressGenerator.getAvatar(this.address, this.size).then((src) => {
                        this.src = src;
                    });
                }
            }

        }

        return new Avatar();

    };

    controller.$inject = ['$scope', 'AddressGenerator'];

    angular.module('app.ui').component('wAvatar', {
        bindings: {
            size: '@',
            address: '<'
        },
        controller: controller,
        templateUrl: 'modules/ui/directives/avatar/avatar.html'
    });
})();
