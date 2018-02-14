(function () {
    'use strict';

    const controller = function (Base) {

        class NavigationTree extends Base {

            constructor() {
                super();
                this.root = null;
            }

            $postLink() {
                this.root = this.root || 'main';

                const root = WavesApp.stateTree.find(this.root);
                this.list = root.getChildren()
                    .map(NavigationTree._remapStateItem);
            }

            static _remapStateItem(item) {
                const list = item.getChildren().map(NavigationTree._remapStateItem);
                const isLeaf = list.length === 0;
                const sref = NavigationTree._getSref(item);

                return { list, isLeaf, sref, id: item.id };
            }

            static _getSref(state) {
                return WavesApp.stateTree.getPath(state.id).join('.');
            }

        }

        return new NavigationTree();
    };

    controller.$inject = ['Base', 'user'];

    angular.module('app.ui').component('wNavigationTree', {
        bindings: {
            root: '@'
        },
        templateUrl: 'modules/ui/directives/navigationTree/navigationTree.html',
        transclude: false,
        controller
    });
})();
