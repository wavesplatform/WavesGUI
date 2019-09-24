(function () {
    'use strict';

    /**
     * @param Base
     * @param {User} user
     * @return {Password}
     */
    const controller = function (Base, user) {

        class Password extends Base {

            /**
             * @type {ng.IFormController|null}
             */
            form = null;
            /**
             * @type {string}
             */
            accountName = '';
            /**
             * @type {string}
             */
            accountAddress = '';

            $postLink() {
                this.observe('accountName', this._onChangeName);
            }

            _onChangeName() {
                Promise.all([
                    user.getFilteredUserList(),
                    user.getMultiAccountUsers()
                ]).then(([legacyUsers = [], users = []]) => {
                    return [...legacyUsers, ...users];
                }).then(users => {
                    return users.some(userToCheck => (
                        userToCheck.name === this.accountName &&
                        userToCheck.address !== this.accountAddress
                    ));
                }).then(isUnique => {
                    this.form.accountName.$setValidity('isUnique', !isUnique);
                });
            }

        }

        return new Password();
    };

    controller.$inject = ['Base', 'user'];

    angular.module('app.ui').component('wAccountName', {
        bindings: {
            onSubmit: '&',
            accountName: '=',
            accountAddress: '<'
        },
        templateUrl: 'modules/ui/directives/account-name/account-name.html',
        transclude: true,
        controller
    });
})();
