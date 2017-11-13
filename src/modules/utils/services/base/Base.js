(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {app.utils} utils
     * @return {Base}
     */
    const factory = function (user, utils) {

        class Base {

            /**
             * @constructor
             * @param {$rootScope.Scope} [$scope]
             */
            constructor($scope) {
                this.__emitterListeners = Object.create(null);
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
            }

            listenEventEmitter(emitter, event, handler) {
                if (!this.__emitterListeners[event]) {
                    this.__emitterListeners[event] = [];
                }
                this.__emitterListeners[event].push({ emitter, handler });
                emitter.on(event, handler);
            }

            stopListenEventEmitter(event, handler, emitter) {
                if (!event) {
                    Object.keys(this.__emitterListeners).forEach((myEvent) => {
                        this.stopListenEventEmitter(myEvent, handler, emitter);
                    });
                    return null;
                }
                if (!handler) {
                    this.__emitterListeners[event].forEach((data) => {
                        this.stopListenEventEmitter(event, data.handler, emitter);
                    });
                }
                this.__emitterListeners[event] = this.__emitterListeners[event].filter((data) => {
                    if (emitter) {
                        if (data.emitter === emitter && data.handler === handler) {
                            emitter.off(event, handler);
                            return false;
                        } else {
                            return true;
                        }
                    } else if (data.handler === handler) {
                        data.emitter.off(event, handler);
                        return false;
                    } else {
                        return true;
                    }
                });
            }

            /**
             * @param {string[]|string} keys
             * @param callback
             * @param {Object} [options]
             * @param {Function} [options.set]
             */
            observe(keys, callback, options) {
                this.receive(utils.observe(this, keys, options), callback, this);
            }

            /**
             * @param {string[]|string} keys
             * @param callback
             * @param {Object} [options]
             * @param {Function} [options.set]
             */
            observeOnce(keys, callback, options) {
                this.receiveOnce(utils.observe(this, keys, options), callback, this);
            }

            stopObserve(keys, handler) {
                this.stopReceive(utils.observe(this, keys), handler);
            }

            /**
             * @param {string|Array<string>} syncList
             * @return {Promise}
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

            $onDestroy() {
                this.signals.destroy.dispatch();
                this.stopReceive();
                this.signals.destroy.off();
                this.stopListenEventEmitter();
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

    factory.$inject = ['user', 'utils'];

    angular.module('app.utils')
        .factory('Base', factory);
})();

/**
 * @typedef {Object} IBaseSignals
 * @property {Signal} destroy
 */
