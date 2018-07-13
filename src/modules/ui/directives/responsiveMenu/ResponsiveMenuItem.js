(function () {
    'use strict';

    /**
     * @param Base
     * @param $element
     * @param $attrs
     * @param $scope
     * @param {app.utils} utils
     * @param {$state} $state
     * @param {State} state
     * @return {ResponsiveMenuItem}
     */
    const controller = function (Base, $element, $attrs, $scope, utils, $state, state) {

        class ResponsiveMenuItem extends Base {

            constructor() {
                super();

                /**
                 * @type {ResponsiveMenu}
                 */
                this.parent = null;
                /**
                 * @type {string}
                 */
                this.value = null;

                $element.on('click', (e) => {
                    e.stopPropagation();

                    if (this.value != null) {
                        this.parent.setActive(this);
                        $scope.$apply();
                    }
                });
            }

            $postLink() {
                this.parent.registerItem(this);

                if (this.value != null && $attrs.activeByState) {
                    this.receive(state.signals.changeRouterStateSuccess, this._onChangeState, this);
                    this._onChangeState();
                } else if (this.value != null) {
                    this.receive(utils.observe(this.parent, 'activeMenu'), () => {
                        $element.toggleClass('active', this.parent.activeMenu === this.value);
                    });
                    $element.toggleClass('active', this.parent.activeMenu === this.value);
                }
            }

            _onChangeState() {
                const id = $state.$current.name.slice($state.$current.name.lastIndexOf('.') + 1).replace('-demo', '');
                const path = WavesApp.stateTree.getPath(id);
                if (path) {
                    const active = this.value === path[path.length - 1];
                    $element.toggleClass('active', active);
                    $element.toggleClass('has-active', path.indexOf(this.value) !== -1 && !active);
                }
            }

        }

        return new ResponsiveMenuItem();
    };

    controller.$inject = ['Base', '$element', '$attrs', '$scope', 'utils', '$state', 'state'];

    angular.module('app.ui').component('wResponsiveMenuItem', {
        template: '<div class="responsive-menu-item-content" ng-transclude></div>',
        require: { parent: '^wResponsiveMenu' },
        bindings: {
            value: '@'
        },
        transclude: true,
        controller
    });

})();
