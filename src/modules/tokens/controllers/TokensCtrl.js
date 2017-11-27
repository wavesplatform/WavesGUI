(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {ModalManager} modalManager
     * @return {TokensCtrl}
     */
    const controller = function (Base, $scope, modalManager) {

        class TokensCtrl extends Base {

            constructor() {
                super($scope);
                this.name = '';
                this.description = '';
                this.issue = true;
                this.count = null;
                this.precision = null;
            }

            generate() {
                modalManager.showCustomModal({
                    ns: 'app.tokens',
                    controller: 'TokenGenerateModalCtrl',
                    titleContent: '{{$ctrl.title}}',
                    mod: 'tokens-generate-modal',
                    contentUrl: '/modules/tokens/templates/generate.modal.htm.html'
                });
            }

        }

        return new TokensCtrl();
    };

    controller.$inject = ['Base', '$scope', 'modalManager'];

    angular.module('app.tokens').controller('TokensCtrl', controller);
})();

