(function () {
    'use strict';

    /**
     * @param {Storage} storage
     * @returns {User}
     */
    const factory = function (storage) {

        class User {

            constructor() {
                this.name = null;
                this.address = null;
                this.encodedSeed = null;
                this.lastConfirmPassword = null;
                this.lastNotificationTimeStamp = null;
                this.lastLogin = Date.now();
            }

            /**
             * @param {Object} data
             * @param {string} data.name
             * @param {string} data.address
             * @param {string} data.encodedSeed
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

            _check() {
                if (!this.address) {
                    // TODO Need login!
                    throw new Error('No address!');
                }
            }

            _save() {
                return storage.getItem('userList').then((list) => {
                    list = list || [];
                    const item = _.find(list, { address: this.address }) || Object.create(null);
                    list.push({ ...item, ...this });
                    return storage.save('userList', list);
                });
            }

        }


        return new User();
    };

    factory.$inject = ['Storage'];

    angular.module('app').factory('User', factory);
})();
