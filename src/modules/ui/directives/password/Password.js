(function () {
    'use strict';

    /**
     * @param Base
     * @param {app.utils} utils
     * @param {User} user
     * @return {Password}
     */
    const controller = function (Base, utils, user) {

        class Password extends Base {

            constructor() {
                super();
                this.create = null;
                this.valid = false;
                this.confirmPassword = '';
            }

            $postLink() {
                this.receive(utils.observe(this.create, '$valid'), this._onChangeFormValid, this);
                this.observe('name', this._onChangeName);
            }

            _onChangeFormValid() {
                this.valid = this.create.$valid;
            }

            _onChangeName() {
                user.getFilteredUserList()
                    .then(usersInStorage => {
                        return usersInStorage.some(user => {
                            return user.name === this.name && user.address !== this.address;
                        });
                    })
                    .then(isUnique => {
                        this.create.userName.$setValidity('isUnique', !isUnique);
                    });
            }

        }

        return new Password();
    };

    controller.$inject = ['Base', 'utils', 'user'];

    angular.module('app.ui').component('wPassword', {
        bindings: {
            onSubmit: '&',
            password: '=',
            name: '=',
            address: '<'
        },
        templateUrl: 'modules/ui/directives/password/password.html',
        transclude: true,
        controller
    });
})();
