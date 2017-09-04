(function () {
    'use strict';

    /**
     * @param {Storage} storage
     * @returns {User}
     */
    const factory = function (storage) {

        class User {

            constructor() {
                this.address = null;
                this.encryptedSeed = null;
                this.lastConfirmPassword = null;
                this.lastNotificationTimeStamp = null;
                this.lastLogin = Date.now();
            }

            /**
             * @param {Object} data
             * @param {string} data.address
             * @param {string} data.encryptedSeed
             */
            setUserData(data) {
                Object.keys(data).forEach((key) => {
                    this[key] = data[key];
                });

                this._check();

                this._save().catch((e) => {
                    console.log(e);
                });
            }

            /**
             * @param {Object} data
             * @param {string} data.address
             * @param {string} data.encryptedSeed
             */
            login(data) {
                this.lastLogin = Date.now();
                this.setUserData(data);
            }

            /**
             * @returns {Promise}
             */
            getUserList() {
                return storage.load('userList').then((list) => {
                    list = list || [];

                    list.sort((a, b) => {
                        return a.lastLogin - b.lastLogin;
                    }).reverse();

                    return list;
                });
            }

            /**
             * @private
             */
            _check() {
                if (!this.address || !this.encryptedSeed) {
                    // TODO Need login!
                    throw new Error('No address!');
                }
            }

            /**
             * @returns {Promise}
             * @private
             */
            _save() {
                return storage.load('userList').then((list) => {
                    list = list || [];
                    let item = tsUtils.find(list, { address: this.address });

                    if (!item) {
                        item = Object.create(null);
                        list.push(item);
                    }

                    tsUtils.each(this, (value, key) => {
                        item[key] = value;
                    });

                    return storage.save('userList', list);
                });
            }

        }


        return new User();
    };

    factory.$inject = ['storage'];

    angular.module('app').factory('user', factory);
})();
