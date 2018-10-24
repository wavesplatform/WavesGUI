(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class ScriptModalCtrl extends Base {

            get activeState() {
                return this.state[this.activeTab];
            }

            tx = null;
            state = Object.create(null);
            step = 0;
            activeTab = 'script';


            constructor() {
                super($scope);

                this.observe('activeTab', this._onChangeActiveTab);
                this._onChangeActiveTab();
            }

            onClickBack() {
                this.step--;
            }

            nextStep(signable) {
                this.signable = signable;
                this.step++;
            }

            /**
             * @private
             */
            _onChangeActiveTab() {
                const tab = this.activeTab;
                if (!this.state[tab]) {
                    this.state[tab] = Object.create(null);
                }
            }

        }

        return new ScriptModalCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('ScriptModalCtrl', controller);
})();
