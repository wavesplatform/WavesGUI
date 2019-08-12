/* global WavesApp: readonly */
(() => {
    'use strict';

    const { libs } = require('@waves/waves-transactions');
    const { getAdapterByType } = require('@waves/signature-adapter');
    const {
        encryptSeed,
        decryptSeed,
        base58Encode,
        base58Decode,
        blake2b,
        stringToBytes,
        address: buildAddress
    } = libs.crypto;

    let _password;
    let _rounds;
    let _users = {};

    class MultiAccount {

        static $inject = ['utils'];

        /**
         * @type {app.utils}
         */
        utils;

        constructor(utils) {
            this.utils = utils;
        }

        signUp(password, rounds) {
            _password = password;
            _rounds = rounds;
            _users = {};

            const str = JSON.stringify(_users);
            const multiAccountHash = base58Encode(blake2b(stringToBytes(str)));
            const multiAccountData = encryptSeed(str, _password, _rounds);

            return Promise.resolve({
                multiAccountData,
                multiAccountHash
            });
        }

        signIn(encryptedAccount, password, rounds, hash) {
            try {
                const str = decryptSeed(encryptedAccount, password, rounds);

                if (base58Encode(blake2b(stringToBytes(str))) !== hash) {
                    throw new Error('hash does not match');
                }

                _password = password;
                _rounds = rounds;
                _users = JSON.parse(str);

                return Promise.resolve();
            } catch (e) {
                return Promise.reject(e);
            }
        }

        signOut() {
            _password = undefined;
            _rounds = undefined;
            _users = {};
        }

        addUser({ userType, networkByte, seed, id, publicKey }) {
            const userHash = this._hash(networkByte + publicKey);

            _users[userHash] = {
                userType,
                networkByte,
                seed,
                id,
                publicKey
            };

            const str = JSON.stringify(_users);
            const multiAccountHash = base58Encode(blake2b(stringToBytes(str)));
            const multiAccountData = encryptSeed(str, _password, _rounds);

            return Promise.resolve({
                multiAccountData,
                multiAccountHash,
                userHash
            });
        }

        deleteUser(userHash) {
            delete _users[userHash];

            const str = JSON.stringify(_users);
            const multiAccountHash = base58Encode(blake2b(stringToBytes(str)));
            const multiAccountData = encryptSeed(str, _password, _rounds);

            return Promise.resolve({
                multiAccountData,
                multiAccountHash,
                userHash
            });
        }

        getAdapter(userHash) {
            const user = _users[userHash];

            if (!user) {
                return Promise.reject();
            }

            const Adapter = getAdapterByType(user.userType);

            if (user.userType === 'seed') {
                return Promise.resolve(new Adapter(user.seed, user.networkByte));
            } else {
                return Promise.resolve(new Adapter(user));
            }
        }

        toList(multiAccountUsers) {
            return Object.entries(multiAccountUsers || {}).map(([userHash, user]) => {
                const _user = _users[userHash];

                return {
                    ..._user,
                    ...user,
                    address: buildAddress({ publicKey: _user.publicKey }, String.fromCharCode(_user.networkByte)),
                    hash: userHash
                };
            }).sort(this.utils.comparators.process(user => user.lastLogin).asc);
        }

        /**
         * @param {string} str
         */
        _hash(str) {
            return base58Encode(blake2b(base58Decode(str)));
        }

    }

    angular.module('app').service('multiAccount', MultiAccount);
})();
