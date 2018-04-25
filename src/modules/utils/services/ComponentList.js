(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @return {ComponentList}
     */
    const factory = function (utils) {

        const tsUtils = require('ts-utils');

        class ComponentList {

            get length() {
                return this.components.length;
            }

            /**
             * @param {IComponent[]} [components]
             */
            constructor(components) {
                /**
                 * @type {Object.<string, IComponent>}
                 * @private
                 */
                this._hash = Object.create(null);
                /**
                 * @type {IComponentListSignals}
                 */
                this.signals = utils.liteObject({
                    add: new tsUtils.Signal(),
                    remove: new tsUtils.Signal()
                });
                /**
                 * @type {Array}
                 */
                this.components = [];
                if (components && components.length) {
                    this.add(components);
                }
            }

            /**
             * @param {IComponent|IComponent[]} components
             */
            add(components) {
                utils.toArray(components).forEach(this._add, this);
            }

            /**
             * @param {IComponent|IComponent[]} components
             */
            remove(components) {
                utils.toArray(components).forEach(this._remove, this);
            }

            push(...components) {
                this.add(components);
            }

            forEach(cb, context) {
                this.components.forEach(cb, context);
            }

            map(cb, context) {
                return this.components.map(cb, context);
            }

            filter(cb, context) {
                return new ComponentList(this.components.filter(cb, context));
            }

            /**
             * @param {Partial<IComponent>} props
             * @return {ComponentList}
             */
            where(props) {
                const filter = tsUtils.contains(props);
                return new ComponentList(this.components.filter(filter));
            }

            /**
             * @param {object|function} cb
             * @param {*} [context]
             * @return {boolean}
             */
            some(cb, context) {
                if (typeof cb === 'function') {
                    return this.components.some(cb, context);
                } else {
                    return this.components.some(tsUtils.contains(cb));
                }
            }

            /**
             * @param {object|function} cb
             * @param {*} [context]
             * @return {boolean}
             */
            every(cb, context) {
                if (typeof cb === 'function') {
                    return this.components.every(cb, context);
                } else {
                    return this.components.every(tsUtils.contains(cb));
                }
            }

            get(index) {
                return this.components[index];
            }

            first() {
                return this.components[0];
            }

            last() {
                return this.components[this.components.length - 1];
            }

            index(id, field) {
                return this.components.indexOf(tsUtils.find(this.components, { [field]: id }));
            }

            /**
             * @param {IComponent} component
             * @private
             */
            _add(component) {
                this.receiveOnce(component.signals.destroy, () => this.remove(component));
                this._hash[component.cid] = component;
                this.components.push(component);
                this.signals.add.dispatch(component);
            }

            /**
             * @param {IComponent} component
             * @private
             */
            _remove(component) {
                delete this._hash[component.cid];
                const index = this.components.indexOf(component);
                if (index !== -1) {
                    this.components.splice(index, 1);
                    this.signals.remove.dispatch(component);
                }
            }

        }

        /**
         * @access protected
         * @type {*|<T, R>(signal: Signal<T>, handler: Signal.IHandler<T, R>, context?: R) => void}
         */
        ComponentList.prototype.receive = tsUtils.Receiver.prototype.receive;
        /**
         * @access protected
         * @type {*|<T, R>(signal: Signal<T>, handler: Signal.IHandler<T, R>, context?: R) => void}
         */
        ComponentList.prototype.receiveOnce = tsUtils.Receiver.prototype.receiveOnce;
        /**
         * @access protected
         * @type {*|((item?: TStopArg1, handler?: Signal.IHandler<any, any>) => void)}
         */
        ComponentList.prototype.stopReceive = tsUtils.Receiver.prototype.stopReceive;

        return ComponentList;
    };

    factory.$inject = ['utils'];

    angular.module('app.utils').factory('ComponentList', factory);
})();

/**
 * @typedef {object} IComponent
 * @property {IBaseSignals} signals
 * @property {string} cid
 */

/**
 * @typedef {object} IComponentListSignals
 * @property {Signal<IComponent>} add
 * @property {Signal<IComponent>} remove
 */
