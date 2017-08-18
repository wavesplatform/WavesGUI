(function () {
    'use strict';

    class Avatar {

        /**
         * @constructor
         * @param {AddressGenerator} addressGenerator
         */
        constructor(addressGenerator) {
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
            /**
             * @type {AddressGenerator}
             */
            this.generator = addressGenerator;
        }

        $postLink() {
            if (!this.address) {
                throw new Error('No address for avatar!');
            }
            if (!this.size) {
                this.size = 67;
            }

            this.generator.getAvatar(this.address, this.size).then((src) => {
                this.src = src;
            });
        }

    }

    Avatar.$inject = ['AddressGenerator'];

    angular.module('app.ui').component('wAvatar', {
        bindings: {
            size: '@',
            address: '@'
        },
        controller: Avatar,
        templateUrl: 'modules/ui/directives/avatar/avatar.html'
    });
})();
