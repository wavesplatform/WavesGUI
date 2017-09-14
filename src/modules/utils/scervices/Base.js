(function () {
    'use strict';

    const factory = function (user, $timeout) {

        class Base {

            /**
             * @param {string[]|string} keys
             * @param callback
             */
            observe(keys, callback) {
                if (!this._timersHash) {
                    this._timersHash = Object.create(null);
                }
                if (!this._handlers) {
                    this._handlers = Object.create(null);
                }
                keys = Array.isArray(keys) ? keys : [keys];
                const event = keys.join(' ');
                keys.forEach((key) => {
                    if (!this._handlers[key]) {
                        this._handlers[key] = [];
                    }
                    if (this._handlers[key].indexOf(callback) === -1) {
                        this._handlers[key].push(callback);
                    }
                    if (!this._props) {
                        this._props = Object.create(null);
                    }
                    this._props[key] = this[key];
                    Object.defineProperty(this, key, {
                        get: () => this._props[key],
                        set: (value) => {
                            const previous = this._props[key];
                            if (value !== previous) {
                                this._props[key] = value;
                                if (!this._timersHash[event]) {
                                    this._timersHash[event] = $timeout(() => {
                                        this._handlers[key].forEach((cb) => {
                                            cb.call(this, previous);
                                        });
                                        delete this._timersHash[event];
                                    }, 0);
                                }
                            }
                        }
                    });
                });
            }

            /**
             * @param {string|Array<string>} syncList
             */
            syncSettings(syncList) {
                syncList = Array.isArray(syncList) ? syncList : [syncList];
                syncList.forEach((settingsPath) => {
                    const words = settingsPath.split(/\W/);
                    const name = words[words.length - 1];

                    this.observe(name, () => {
                        user.setSetting(settingsPath, this[name]);
                    });

                    user.getSetting(settingsPath)
                        .then((value) => {
                            this[name] = value;
                        });
                });
            }

        }

        return Base;
    };

    factory.$inject = ['user', '$timeout'];

    angular.module('app.utils')
        .factory('Base', factory);
})();
