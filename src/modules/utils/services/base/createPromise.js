(function () {
    'use strict';

    /**
     * @param {typeof BaseClassComponent} BaseClassComponent
     * @param {typeof PromiseControl} PromiseControl
     * @return {PromiseComponent.create}
     */
    const factory = function (BaseClassComponent, PromiseControl) {

        const componentsHash = Object.create(null);

        class PromiseComponent extends BaseClassComponent {

            constructor(base) {
                super(base);
                /**
                 * @type {PromiseControl[]}
                 * @private
                 */
                this._promiseList = [];
            }

            remove() {
                super.remove();
                delete componentsHash[this.parent.cid];
                this._promiseList.forEach((promise) => {
                    promise.drop();
                });
                this._promiseList = [];
            }

            /**
             * @param {Promise|PromiseControl} promise
             * @return {PromiseControl}
             */
            wrap(promise) {
                const control = new PromiseControl(promise);
                this._promiseList.push(control);
                control.always(() => {
                    const index = this._promiseList.indexOf(control);
                    if (index !== -1) {
                        this._promiseList.splice(index, 1);
                    }
                });
                return control;
            }

            /**
             * @param {Base} base
             * @param {Promise|PromiseControl} promise
             */
            static create(base, promise) {
                return PromiseComponent._getComponent(base).wrap(promise);
            }

            /**
             * @param {Base} base
             * @return {PromiseComponent}
             * @private
             */
            static _getComponent(base) {
                if (componentsHash[base.cid]) {
                    return componentsHash[base.cid];
                } else {
                    componentsHash[base.cid] = new PromiseComponent(base);
                    return componentsHash[base.cid];
                }
            }

        }

        return PromiseComponent.create;
    };

    factory.$inject = ['BaseClassComponent', 'PromiseControl'];

    angular.module('app.utils').factory('createPromise', factory);
})();

/**
 * @typedef {function(base: Base, promise: Promise|PromiseControl): PromiseControl} IPromiseControlCreate
 */
