(function () {
    'use strict';

    const factory = function (Base) {

        class BaseClassComponent {

            /**
             * @param {Base} parent
             */
            constructor(parent) {

                if (!(parent instanceof Base)) {
                    throw new Error('Can\'t add component to controller, controller not instanceof Base!');
                }

                this.parent = parent;
                this.receiveOnce(parent.signals.destroy, this.remove, this);
            }

            remove() {}

        }

        /**
         * @access protected
         * @type {*|<T, R>(signal: Signal<T>, handler: Signal.IHandler<T, R>, context?: R) => void}
         */
        BaseClassComponent.prototype.receive = tsUtils.Receiver.prototype.receive;
        /**
         * @access protected
         * @type {*|<T, R>(signal: Signal<T>, handler: Signal.IHandler<T, R>, context?: R) => void}
         */
        BaseClassComponent.prototype.receiveOnce = tsUtils.Receiver.prototype.receiveOnce;
        /**
         * @access protected
         * @type {*|((item?: TStopArg1, handler?: Signal.IHandler<any, any>) => void)}
         */
        BaseClassComponent.prototype.stopReceive = tsUtils.Receiver.prototype.stopReceive;

        return BaseClassComponent;
    };

    factory.$inject = ['Base'];

    angular.module('app.utils').factory('BaseClassComponent', factory);

})();
