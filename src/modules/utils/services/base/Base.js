(function () {
    'use strict';

    /**
     * @param {User} user
     * @param $timeout
     * @param {app.utils} utils
     * @param {Poll} Poll
     * @returns {Base}
     */
    const factory = function (user, $timeout, utils, Poll) {

        class Base {

            /**
             * @constructor
             * @param {$rootScope.Scope} [$scope]
             */
            constructor($scope) {
                if ($scope) {
                    const stop = $scope.$on('$destroy', () => {
                        this.$onDestroy();
                        stop();
                    });
                }

                /**
                 * @type {IBaseSignals}
                 */
                this.signals = {
                    destroy: new tsUtils.Signal()
                };
                /**
                 * @type {string}
                 */
                this.cid = tsUtils.uniqueId('base');
                /**
                 * @type {boolean}
                 * @private
                 */
                this.__isRemoved = false;
                /**
                 * @type {object}
                 * @private
                 */
                this.__handlers = Object.create(null);
                /**
                 * @type {object}
                 * @private
                 */
                this.__props = Object.create(null);
                /**
                 * @type {object}
                 * @private
                 */
                this.__timersHash = Object.create(null);
            }

            /**
             * @param {string[]|string} keys
             * @param callback
             * @param {Object} [options]
             * @param {Function} [options.set]
             */
            observe(keys, callback, options = {}) {
                keys = Array.isArray(keys) ? keys : [keys];
                const event = keys.join(' ');

                keys.forEach((key) => {
                    const stop = this.__addHandler(key, callback);
                    if (stop) {
                        return null;
                    }
                    this.__props[key] = this[key];
                    Object.defineProperty(this, key, {
                        get: () => this.__props[key],
                        set: (value) => {
                            value = options.set ? options.set(value) : value;
                            const previous = this.__props[key];
                            if (value !== previous) {
                                this.__props[key] = value;
                                this.__addTimer(event, key, previous);
                            }
                        }
                    });
                });
            }

            /**
             * @param {string|Array<string>} syncList
             * @returns {Promise}
             */
            syncSettings(syncList) {
                syncList = Array.isArray(syncList) ? syncList : [syncList];
                return utils.whenAll(syncList.map((settingsPath) => {
                    const words = settingsPath.split(/\W/);
                    const name = words[words.length - 1];

                    this.observe(name, () => {
                        user.setSetting(settingsPath, this[name]);
                    });

                    return user.getSetting(settingsPath)
                        .then((value) => {
                            this[name] = value;
                        });
                }));
            }

            wrapCallback(cb) {
                return (...args) => {
                    if (!this.__isRemoved) {
                        cb.call(this, ...args);
                    }
                };
            }

            $onDestroy() {
                this.__isRemoved = true;
                this.__handlers = Object.create(null);

                tsUtils.each(this.__timersHash, (value) => {
                    $timeout.cancel(value);
                });
                this.__timersHash = Object.create(null);

                tsUtils.each(this.polls, (poll, key) => {
                    if (poll) {
                        poll.destroy();
                        delete this.polls[key];
                    }
                });
                this.stopReceive();
            }

            /**
             * @param {string} key
             * @param {Function} callback
             * @return {boolean}
             * @private
             */
            __addHandler(key, callback) {
                const needDecorate = !!this.__handlers[key];
                if (needDecorate) {
                    this.__handlers[key].push(callback);
                } else {
                    this.__handlers[key] = [callback];
                }
                return needDecorate;
            }

            /**
             * @param {string} event
             * @param {string} key
             * @param {*} previous
             * @private
             */
            __addTimer(event, key, previous) {
                if (!this.__timersHash[event]) {
                    this.__timersHash[event] = $timeout(() => {
                        if (this.__handlers[key]) {
                            this.__handlers[key].forEach((cb) => {
                                cb.call(this, previous);
                            });
                        }
                        delete this.__timersHash[event];
                    }, 0);
                }
            }

        }

        /**
         * @access protected
         * @type {*|<T, R>(signal: Signal<T>, handler: Signal.IHandler<T, R>, context?: R) => void}
         */
        Base.prototype.receive = tsUtils.Receiver.prototype.receive;
        /**
         * @access protected
         * @type {*|<T, R>(signal: Signal<T>, handler: Signal.IHandler<T, R>, context?: R) => void}
         */
        Base.prototype.receiveOnce = tsUtils.Receiver.prototype.receiveOnce;
        /**
         * @access protected
         * @type {*|((item?: TStopArg1, handler?: Signal.IHandler<any, any>) => void)}
         */
        Base.prototype.stopReceive = tsUtils.Receiver.prototype.stopReceive;

        return Base;
    };

    factory.$inject = ['user', '$timeout', 'utils', 'Poll'];

    angular.module('app.utils')
        .factory('Base', factory);
})();

/**
 * @typedef {Object} IBaseSignals
 * @property {Signal} destroy
 */
