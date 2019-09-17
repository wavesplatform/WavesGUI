/* global WavesApp: readonly */
(() => {
    'use strict';

    const { libs } = require('@waves/waves-transactions');
    const {
        encryptSeed,
        decryptSeed,
        base58Encode,
        base58Decode,
        blake2b,
        stringToBytes,
        address: buildAddress,
        publicKey: buildPublicKey
    } = libs.crypto;

    let _password;
    let _rounds;
    let _users = {};

    class MultiAccount {

        get isSignedIn() {
            return !!_password;
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

        changePassword(encryptedAccount, oldPassword, newPassword, rounds, hash) {
            try {
                const str = decryptSeed(encryptedAccount, oldPassword, rounds);

                if (base58Encode(blake2b(stringToBytes(str))) !== hash) {
                    throw new Error('hash does not match');
                }

                _password = newPassword;
                _rounds = rounds;
                _users = JSON.parse(str);

                const multiAccountData = encryptSeed(str, _password, _rounds);

                return Promise.resolve({
                    multiAccountData,
                    multiAccountHash: hash
                });
            } catch (e) {
                return Promise.reject(e);
            }
        }

        addUser({ userType, networkByte, seed, id, privateKey, publicKey }) {
            const _publicKey = publicKey || buildPublicKey(seed || { privateKey });
            const userHash = this.hash(networkByte + _publicKey);

            _users[userHash] = {
                userType,
                networkByte,
                seed,
                id,
                privateKey,
                publicKey: _publicKey
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

        toList(multiAccountUsers) {
            return this.isSignedIn ?
                Object.entries(multiAccountUsers || {}).map(([userHash, user]) => {
                    const _user = _users[userHash];

                    return {
                        ...user,
                        userType: _user.userType,
                        networkByte: _user.networkByte,
                        id: _user.id,
                        seed: _user.seed,
                        privateKey: _user.privateKey,
                        publicKey: _user.publicKey,
                        address: buildAddress({ publicKey: _user.publicKey }, String.fromCharCode(_user.networkByte)),
                        hash: userHash
                    };
                }).sort((a, b) => b.lastLogin - a.lastLogin) :
                [];
        }

        /**
         * @param {string} str
         */
        hash(str) {
            return base58Encode(blake2b(base58Decode(str)));
        }

    }

    angular.module('app').service('multiAccount', MultiAccount);
})();
