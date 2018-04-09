(function () {
    'use strict';

    const factory = function () {


        class Migration {

            migrateFrom(version, versionList) {
                return versionList
                    .filter(Migration.getCurrentVersionFilter(version))
                    .sort(Migration._comparator);
            }

            sort(versionList) {
                return versionList.slice().sort(Migration._comparator);
            }

            /**
             * @param {string} v1
             * @param {string} v2
             * @return {boolean}
             */
            static lt(v1, v2) {
                const result = Migration._comparator(v1, v2);
                return result < 0;
            }

            /**
             * @param {string} v1
             * @param {string} v2
             * @return {boolean}
             */
            static lte(v1, v2) {
                const result = Migration._comparator(v1, v2);
                return result <= 0;
            }

            /**
             * @param {string} v1
             * @param {string} v2
             * @return {boolean}
             */
            static gt(v1, v2) {
                const result = Migration._comparator(v1, v2);
                return result > 0;
            }

            /**
             * @param {string} v1
             * @param {string} v2
             * @return {boolean}
             */
            static gte(v1, v2) {
                const result = Migration._comparator(v1, v2);
                return result >= 0;
            }

            /**
             * @param {string} lastVersion
             * @return {Function}
             */
            static getCurrentVersionFilter(lastVersion) {
                return function (version) {
                    return (
                        Migration.gt(version, lastVersion) &&
                        Migration.lte(version, WavesApp.version)
                    );
                };
            }

            /**
             * @param {string} v1
             * @param {string} v2
             * @return {number}
             * @private
             */
            static _comparator(v1, v2) {
                v1 = Migration._parse(v1);
                v2 = Migration._parse(v2);

                for (let i = 0; i < v1.length; i++) {
                    const part1 = v1[i];
                    const part2 = v2[i] || 0;

                    if (part1 < part2) {
                        return -1;
                    }
                    if (part1 > part2) {
                        return 1;
                    }
                }

                return 0;
            }

            static _parse(version) {
                return version.replace(/[^0-9.]/g, '').split('.').map(Number);
            }

        }

        return new Migration();
    };

    angular.module('app.utils').factory('migration', factory);
})();
