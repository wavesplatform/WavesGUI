(function () {
    'use strict';

    /**
     * @param Base
     * @param {app.utils} utils
     * @return {Password}
     */
    const controller = function (Base, utils) {

        class Password extends Base {

            constructor() {
                super();
                this.create = null;
                this.valid = false;
                this.confirmPassword = '';
            }

            $postLink() {
                this.receive(utils.observe(this.create, '$valid'), this._onChangeFormValid, this);
            }

            _onChangeFormValid() {
                this.valid = this.create.$valid;
            }

        }

        return new Password();
    };

    controller.$inject = ['Base', 'utils'];

    angular.module('app.ui').component('wPassword', {
        bindings: {
            onSubmit: '&',
            password: '=',
            name: '='
        },
        templateUrl: 'modules/ui/directives/password/password.html',
        transclude: true,
        controller
    });
})();
