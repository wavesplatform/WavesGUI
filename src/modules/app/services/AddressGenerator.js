(function () {
    'use strict';

    const factory = function ($q) {

        class AddressGenerator {


            /**
             * @param {string} address
             * @param {number} [size]
             * @returns {Promise}
             */
            getAvatar(address, size) {
                return $q((resolve, reject) => {
                    identicon.generate({ id: address, size: size }, (err, buffer) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(buffer);
                        }
                    });
                });
            }

            /**
             * @return {string}
             */
            generateSeed() {
                // TODO
                return 'multiply field journey harsh genius morning mom bone inquiry tuition penalty people burst' +
                    ' token wasp';
            }

            /**
             * @param {string} seed
             * @return {string}
             */
            generateAddress(seed) {
                // TODO
                return '3PHAyB9wbHJRGekezs9QXrDN1u5sFRGNgyh';
            }

        }

        return new AddressGenerator();

    };

    factory.$inject = ['$q'];

    angular.module('app').factory('AddressGenerator', factory);
})();
