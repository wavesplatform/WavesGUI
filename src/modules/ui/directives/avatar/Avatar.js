(function () {
    'use strict';

    const ds = require('data-service');

    /**
     * @param {typeof Base} Base
     * @param $q
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @return {Avatar}
     */
    const controller = function (Base, $q, $scope, user) {

        class Avatar extends Base {

            /**
             * @type {boolean}
             */
            hasScript = false;
            /**
             * Avatar size
             * @type {number}
             */
            size = null;
            /**
             * Avatar id
             * @type {string}
             */
            address = null;
            /**
             * Image (base64)
             * @type {string}
             */
            src = null;


            $postLink() {
                this.style = { width: `${this.size}px`, height: `${this.size}px` };

                if (!user.address) {
                    this.receive(user.changeScript, () => {
                        this.hasScript = user.hasScript();
                        $scope.$apply();
                    });
                }
            }

            $onChanges() {
                if (!this.size) {
                    this.size = 67;
                }
                if (this.address) {
                    ds.fetch(`${ds.config.get('node')}/addresses/scriptInfo/${this.address}`).then(data => {
                        this.hasScript = !!data.script;
                        $scope.$apply();
                    });

                    $q((resolve) => {
                        resolve(identityImg.create(this.address, { size: this.size * 3 }));
                    }).then((data) => {
                        this.src = data;
                    });
                } else {
                    this.hasScript = false;
                }
            }

        }

        return new Avatar();

    };

    controller.$inject = ['Base', '$q', '$scope', 'user'];

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
