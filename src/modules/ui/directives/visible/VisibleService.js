(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @returns {VisibleService}
     */
    const factory = function (utils) {

        class VisibleService {

            constructor() {
                this.children = Object.create(null);
                this._handler = utils.debounceRequestAnimationFrame(() => this._onScroll());
            }

            /**
             * @param {Visible} visible
             */
            registerVisibleComponent(visible) {
                this.children[visible.cid] = visible;

                visible.signals.destroy.once(() => {
                    delete this.children[visible.cid];

                    if (Object.keys(this.children).length === 0) {
                        this._removeHandlers();
                    }
                });

                this._addHandlers();
            }

            /**
             * @private
             */
            _onScroll() {
                Object.values(this.children).forEach(item => item.currentVisibleState());
            }

            /**
             * @private
             */
            _addHandlers() {
                document.addEventListener('scroll', this._handler, true);
            }

            /**
             * @private
             */
            _removeHandlers() {
                document.removeEventListener('scroll', this._handler, true);
            }

        }

        return new VisibleService();
    };

    factory.$inject = ['utils'];

    angular.module('app.ui').factory('visibleService', factory);
})();
