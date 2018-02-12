(function () {
    'use strict';

    /**
     *
     * @param {State} state
     * @param {User} user
     * @param {$state} $state
     * @return {Router}
     */
    const factory = function (state, user, $state) {

        class Router {

            constructor() {
                this.rootStateList = [];
                this.subStateList = [];

                state.signals.changeRouterState.on(this._currentStateLists, this);
                this.changeRouteState = state.signals.changeRouterState;
            }

            /**
             * @private
             */
            _currentStateLists() {
                const root = WavesApp.stateTree.find('main');
                const rootPath = WavesApp.stateTree.getPath(root.id).join('.');
                this.rootStateList = root.getChildren()
                    .map((item) => {
                        const path = user.getActiveState(item.id);
                        const base = `${rootPath}.${item.id}`;
                        return { path, name: item.id, base };
                    });
                const idList = $state.$current.split('.');
                const parent = idList[idList.length - 2];
                const stateData = WavesApp.stateTree.find(parent);
                if (stateData && !stateData.get('abstract')) {
                    this.subStateList = stateData.getChildren().map((item) => {
                        const path = WavesApp.stateTree.getPath(item.id).join('.');
                        return { name: item.id, path };
                    });
                } else {
                    this.subStateList = [];
                }
            }
        }

        return new Router();
    };

    factory.$inject = ['state', 'user', '$state'];

    angular.module('app').factory('router', factory);
})();
