(function () {
    'use strict';

    /**
     * @param Base
     * @param {User} user
     * @param {app.utils} utils
     * @return {UserNameService}
     */

    const factory = function (Base, user, utils) {

        class UserNameService extends Base {

            /**
             * @public
             * @type {string}
             */
            name;

            constructor(base) {
                super(base);

                this.MAX_USER_NAME_LENGTH = 24;

                user.loginSignal.on(() => {
                    this.name = user.name;
                });

                user.logoutSignal.on(() => {
                    this.name = '';
                });

                this.receive(utils.observe(user, 'name'), () => {
                    this.name = user.name;
                }, this);

            }

            /**
             * @public
             */
            save() {
                return this.isUniqueName().then(isUniqueName => {
                    const isNameValid = isUniqueName && this._isNameLengthValid();
                    if (isNameValid) {
                        user.name = this.name;
                    } else {
                        this.name = user.name;
                    }
                });
            }

            /**
             * @public
             * @param {string}
             */
            setName(name) {
                this.name = name;
            }

            /**
             * @public
             * @return {boolean}
             */
            isUniqueName() {
                return this._getUserList().then(list => {
                    const isUnique = list
                        .filter(item => item.address !== user.address)
                        .every(item => item.name !== this.name);
                    return !this.name || isUnique;
                });
            }

            /**
             * @return {boolean}
             * @private
             */
            _isNameLengthValid() {
                return this.name ? this.name.length <= this.MAX_USER_NAME_LENGTH : true;
            }

            /**
             * @return {Promise[]}
             * @private
             */
            _getUserList() {
                return Promise.all([
                    user.getFilteredUserList(),
                    user.getMultiAccountUsers()
                ]).then(([legacyUsers = [], users = []]) => {
                    return [...legacyUsers, ...users];
                });
            }

        }

        return new UserNameService();
    };

    factory.$inject = ['Base', 'user', 'utils'];

    angular.module('app.ui').factory('userNameService', factory);
})();
