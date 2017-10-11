(function () {
    'use strict';

    const factory = function () {

        class PromiseControl {

            /**
             * @param {Promise} promise
             */
            constructor(promise) {
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

            abort(error) {
                this._getPromiseCallback(false)(error);
            }

            /**
             * @param {Function|null} resolve
             * @param {Function|null} reject
             * @return {Promise}
             */
            then(resolve, reject) {
                if (this._dropped) {
                    return null;
                }
                if (this._state === null) {
                    if (resolve) {
                        this._resolveCallbacks.push(resolve);
                    }
                    if (reject) {
                        this._rejectCallbacks.push(reject);
                    }
                } else {
                    if (this._state && resolve) {
                        resolve(this._data);
                    }
                    if (!this._state && reject) {
                        reject(this._data);
                    }
                }
                return this._promise;
            }

            /**
             * @param cb
             * @return {Promise}
             */
            always(cb) {
                return this.then(cb, cb);
            }

            /**
             * @param callback
             * @return {Promise}
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
                list.forEach(cb => cb(this._data));
            }

            _removeHandlers() {
                this._rejectCallbacks = [];
                this._rejectCallbacks = [];
            }

        }

        return PromiseControl;
    };

    factory.$inject = [];

    angular.module('app.utils').factory('PromiseControl', factory);
})();
