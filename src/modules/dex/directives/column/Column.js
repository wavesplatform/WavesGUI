(function () {
    'use strict';

    /**
     * @param Base
     * @param {JQuery} $element
     * @param {app.utils} utils
     * @param {User} user
     * @return {Column}
     */
    const controller = function (Base, $element, $attrs, utils, user) {

        class Column extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.savePath = null;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._state = user.address ? user.getSettingByUser(user, $attrs.savePath) : false;

                this.observe('_state', this._onChangeState);
                this._onChangeState();
            }

            $postLink() {
                this._setHandlers();
                if (this.savePath) {
                    this.syncSettings({ _state: this.savePath });
                }
            }

            /**
             * @private
             */
            _onChangeState() {
                utils.animateByClass($element, 'collapsed', this._state);
            }

            /**
             * @private
             */
            _setHandlers() {
                $element.on('click', '.control', this._toggleOpen.bind(this));
            }

            /**
             * @private
             */
            _toggleOpen() {
                this._state = !this._state;
            }

        }

        return new Column();
    };

    controller.$inject = ['Base', '$element', '$attrs', 'utils', 'user'];

    angular.module('app.dex').component('wColumn', {
        bindings: {
            savePath: '@'
        },
        template: '<div class="column-container" ng-transclude></div><div class="control"></div> ',
        transclude: true,
        controller
    });
})();
