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
                this.encryptSeed = null;
                this.lastConfirmPassword = null;
                this.lastNotificationTimeStamp = null;
                this.lastLogin = Date.now();
            }

            /**
             * @param {Object} data
             * @param {string} data.address
             * @param {string} data.encryptSeed
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
             * @param {string} data.encryptSeed
             */
            login(data) {
                this.lastLogin = Date.now();
                this.setUserData(data);
            }

            getUserList() {
                return storage.load('userList').then((list) => {
                    list = list || [];

                    list.sort((a, b) => {
                        return a.lastLogin - b.lastLogin;
                    }).reverse();

                    return list;
                });
            }

            _check() {
                if (!this.address || !this.encryptSeed) {
                    // TODO Need login!
                    throw new Error('No address!');
                }
            }

            _save() {
                return storage.load('userList').then((list) => {
                    list = list || [];
                    let item = utils.find(list, { address: this.address });

                    if (!item) {
                        item = Object.create(null);
                        list.push(item);
                    }

                    utils.each(this, (value, key) => {
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
