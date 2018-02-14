(function () {
    'use strict';

    /**
     *
     * @param {Base} Base
     * @param {JQuery} $element
     * @param {$state} $state
     * @param {State} state
     */
    const controller = function (Base, $element, $state, state) {

        class NavigationItem extends Base {

            constructor() {
                super();

                this.item = null;

                this.observe('item', this._onChangeStateOrData);
                this.receive(state.signals.changeRouterState, this._onChangeStateOrData, this);
            }

            _onChangeStateOrData() {
                if (!this.item || !this.item.isLeaf) {
                    return null;
                }
                const active = $state.$current.name === WavesApp.stateTree.getPath(this.item.id).join('.');
                $element.toggleClass('active', active);
            }

        }

        return new NavigationItem();

    };

    controller.$inject = ['Base', '$element', '$state', 'state'];

    angular.module('app.ui').component('wNavigationTreeItem', {
        bindings: {
            item: '<'
        },
        templateUrl: 'modules/ui/directives/navigationTree/navigationTreeItem.html',
        transclude: false,
        controller
    });
})();
