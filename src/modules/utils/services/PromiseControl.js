(function () {
    'use strict';

    const factory = function () {

        class PromiseControl {

            /**
             * @param {Promise} promise
             */
            constructor(promise) {
                this.id = null;
                /**
                 * @type {Array}
                 * @private
                 */
                this._resolveCallbacks = [];
                /**
                 * @type {Array}
                 * @private
                 */
                this._rejectCallbacks = [];
                /**
                 * @type {*}
                 * @private
                 */
                this._data = null;
                /**
                 * @type {boolean|null}
                 * @private
                 */
                this._state = null;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._dropped = false;
                /**
                 * @type {Promise}
                 * @private
                 */
                this._promise = promise;

                promise.then(this._getPromiseCallback(true), this._getPromiseCallback(false));
            }

            promise() {
                return this._promise;
            }

            abort(error) {
                this._getPromiseCallback(false)(error);
            }

            /**
             * @param {Function|null} resolve
             * @param {Function|null} [reject]
             * @return {PromiseControl}
             */
            then(resolve, reject) {
                return new PromiseControl(new Promise((res, rej) => {
                    this._resolveCallbacks.push((data) => {
                        const result = resolve ? resolve(data) : data;
                        if (PromiseControl.isPromise(result)) {
                            result.then(res, rej);
                        } else {
                            res(result);
                        }
                    });
                    this._rejectCallbacks.push((data) => {
                        const result = reject ? reject(data) : data;
                        if (PromiseControl.isPromise(result)) {
                            result.then(res, rej);
                        } else {
                            rej(result);
                        }
                    });
                }));
            }

            /**
             * @param cb
             * @return {PromiseControl}
             */
            always(cb) {
                this.then(cb, cb);
                return this;
            }

            /**
             * @param callback
             * @return {PromiseControl}
             */
            catch(callback) {
                return this.then(null, callback);
            }

            drop() {
                this._removeHandlers();
                this._dropped = true;
            }

            _getPromiseCallback(state) {
                return (data) => {
                    if (this._state === null) {
                        this._data = data;
                        this._state = state;
                        this._run();
                    }
                };
            }

            _run() {
                if (this._dropped || this._state === null) {
                    return null;
                }
                const list = (this._state ? this._resolveCallbacks : this._rejectCallbacks).slice();
                this._removeHandlers();
                list.forEach((cb) => cb(this._data));
            }

            _removeHandlers() {
                this._rejectCallbacks = [];
                this._rejectCallbacks = [];
            }

            static isPromise(some) {
                return some && some.then && typeof some.then === 'function';
            }

        }

        return PromiseControl;
    };

    factory.$inject = [];

    angular.module('app.utils').factory('PromiseControl', factory);
})();
