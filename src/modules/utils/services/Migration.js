(function () {
    'use strict';

    const factory = function () {


        const migration = {

            migrateFrom: (version, versionList) => {
                return versionList
                    .filter(migration.getCurrentVersionFilter(version))
                    .sort(migration._comparator);
            },

            sort: (versionList) => {
                return versionList.slice().sort(migration._comparator);
            },

            /**
             * @param {string} v1
             * @param {string} v2
             * @return {boolean}
             */
            lt: (v1, v2) => {
                const result = migration._comparator(v1, v2);
                return result < 0;
            },

            /**
             * @param {string} v1
             * @param {string} v2
             * @return {boolean}
             */
            lte: (v1, v2) => {
                const result = migration._comparator(v1, v2);
                return result <= 0;
            },

            /**
             * @param {string} v1
             * @param {string} v2
             * @return {boolean}
             */
            gt: (v1, v2) => {
                const result = migration._comparator(v1, v2);
                return result > 0;
            },

            /**
             * @param {string} v1
             * @param {string} v2
             * @return {boolean}
             */
            gte: (v1, v2) => {
                const result = migration._comparator(v1, v2);
                return result >= 0;
            },

            /**
             * @param {string} lastVersion
             * @return {Function}
             */
            getCurrentVersionFilter: (lastVersion) => {
                return function (version) {
                    return (
                        migration.gt(version, lastVersion) &&
                        migration.lte(version, WavesApp.version)
                    );
                };
            },

            /**
             * @param {string} v1
             * @param {string} v2
             * @return {number}
             * @private
             */
            _comparator: (v1, v2) => {

                const v1Beta = v1.includes('beta');
                const v2Beta = v2.includes('beta');

                if (v1Beta && !v2Beta) {
                    return -1;
                } else if (!v1Beta && v2Beta) {
                    return 1;
                }

                v1 = migration._parse(v1);
                v2 = migration._parse(v2);

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
            },

            _parse: (version) => {
                return version.replace(/[^0-9.]/g, '').split('.').map(Number);
            }

        };

        return migration;
    };

    angular.module('app.utils').factory('migration', factory);
})();
