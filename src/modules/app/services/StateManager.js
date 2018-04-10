(function () {
    'use strict';

    /**
     *
     * @param {State} state
     * @param {User} user
     * @param {$state} $state
     * @return {StateManager}
     */
    const factory = function (state, user, $state) {

        class StateManager {

            constructor() {
                this.rootStateList = [];
                this.subStateList = [];

                state.signals.changeRouterStateSuccess.on(this._currentStateLists, this);
                this.changeRouteState = state.signals.changeRouterStateSuccess;
                this._currentStateLists();
            }

            getSrefByState(state) {
                return WavesApp.stateTree.getPath(state.id).join('.');
            }

            getStateTree(fromId = 'main') {
                const root = WavesApp.stateTree.find(fromId);
                return root.getChildren()
                    .map(StateManager._remapStateItem);
            }

            /**
             * @private
             */
            _currentStateLists() {
                if (!$state.$current || !$state.$current.name) {
                    return false;
                }

                const root = WavesApp.stateTree.find('main');
                const rootPath = WavesApp.stateTree.getPath(root.id).join('.');
                this.rootStateList = root.getChildren()
                    .map((item) => {
                        const path = user.getActiveState(item.id);
                        const base = `${rootPath}.${item.id}`;
                        return { path, name: item.id, base };
                    });
                const idList = $state.$current.name.split('.');
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

            static _remapStateItem(item) {
                const list = item.getChildren().map(StateManager._remapStateItem);
                const isLeaf = list.length === 0;
                const result = { list, isLeaf, id: item.id };

                if (list.length) {
                    Object.defineProperty(result, 'sref', {
                        get: () => user.getActiveState(item.id)
                    });
                } else {
                    result.sref = user.getActiveState(item.id);
                }

                return result;
            }

        }

        return new StateManager();
    };

    factory.$inject = ['state', 'user', '$state'];

    angular.module('app').factory('stateManager', factory);
})();
