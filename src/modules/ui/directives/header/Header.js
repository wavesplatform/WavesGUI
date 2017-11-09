(function () {
    'use strict';

    /**
     * @param {JQuery} $element
     * @param {Base} Base
     * @param {User} user
     * @param {State} state
     * @param $state
     * @param {app.i18n} i18n
     * @param {ModalManager} modalManager
     * @return {Header}
     */
    const controller = function ($element, Base, user, state, $state, i18n, modalManager) {

        class Header extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.address = user.address;
                this.stateList = [];

                this._onChangeRouterState($state.$current);

                this.receive(state.signals.changeRouterState, this._onChangeRouterState, this);
            }

            avatarClick() {
                modalManager.showAccountInfo();
            }

            _onChangeRouterState(state) {
                const ids = state.name.split('.');
                const parent = ids[ids.length - 2];
                const stateData = WavesApp.stateTree.find(parent);
                if (stateData && !stateData.get('abstract')) {
                    this.stateList = stateData.getChildren().map((item) => {
                        const path = WavesApp.stateTree.getPath(item.id).join('.');
                        return { name: item.id, path, text: i18n.translate(`header.${item.id}`, 'app') };
                    });
                } else {
                    this.stateList = [];
                }
            }

        }

        return new Header();
    };

    controller.$inject = ['$element', 'Base', 'user', 'state', '$state', 'i18n', 'modalManager'];

    angular.module('app.ui').component('wHeader', {
        controller: controller,
        templateUrl: 'modules/ui/directives/header/header.html'
    });
})();
