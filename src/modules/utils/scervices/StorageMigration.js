(function () {
    'use strict';

    const factory = function () {


        const MIGRATION_MAP = {
            '1.0.0': function (storage) {
                return storage.load('Wavesmainnet').then((data) => {
                    if (!data) {
                        return null;
                    }

                    const userList = data.accounts.map((account) => {
                        return {
                            address: account.address,
                            encryptedSeed: account.cipher,
                            settings: {
                                encryptionRounds: 1000
                            }
                        };
                    });
                    return storage.clear().then(() => storage.save('userList', userList));
                });
            }
        };


        class StorageMigration {

            migrateTo(version, storage) {
                const versions = Object.keys(MIGRATION_MAP).sort(StorageMigration._comparator);

                let applyStack;

                if (!version) {
                    applyStack = versions.slice();
                } else {
                    let index;
                    versions.some((migrateVersion, i) => {
                        if (StorageMigration.lt(version, migrateVersion)) {
                            index = i;
                            return true;
                        }
                    });
                    if (index != null) {
                        applyStack = versions.slice(index);
                    }
                }

                if (!applyStack || !applyStack.length) {
                    return null;
                }

                const apply = function () {
                    const current = versions.pop();
                    MIGRATION_MAP[current](storage).then(() => {
                        if (versions.length) {
                            apply();
                        }
                    });
                };
                versions.reverse();
                apply();
            }

            static lt(v1, v2) {
                const result = StorageMigration._comparator(v1, v2);
                return result < 0;
            }

            // static le(v1, v2) {
            //     const result = StorageMigration._comparator(v1, v2);
            //     return result <= 0;
            // }
            //
            // static gt(v1, v2) {
            //     const result = StorageMigration._comparator(v1, v2);
            //     return result > 0;
            // }
            //
            // static ge(v1, v2) {
            //     const result = StorageMigration._comparator(v1, v2);
            //     return result >= 0;
            // }

            static _comparator(v1, v2) {
                v1 = StorageMigration._parse(v1);
                v2 = StorageMigration._parse(v2);

                const major = v1.major - v2.major;

                if (major === 0) {
                    const minor = v1.minor - v2.minor;
                    if (minor === 0) {
                        return v1.patch - v2.patch;
                    } else {
                        return minor;
                    }
                } else {
                    return major;
                }
            }

            static _parse(version) {
                version = version.replace(/[^0-9.]/g, '');
                const parts = version.split('.');
                return {
                    major: parts[0],
                    minor: parts[1],
                    patch: parts[2]
                };
            }

        }

        return new StorageMigration();
    };

    angular.module('app.utils').factory('storageMigration', factory);
})();
