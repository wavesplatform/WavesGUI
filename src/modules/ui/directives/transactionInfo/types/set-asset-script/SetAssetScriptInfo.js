(function () {
    'use strict';

    const ds = require('data-service');

    /**
     * @param {$rootScope.Scope} $scope
     * @param {JQuery} $element
     * @return {SetAssetScriptInfo}
     */
    const controller = function ($scope, $element) {

        class SetAssetScriptInfo {

            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {Asset}
             */
            asset;
            /**
             * @type {boolean}
             */
            shownScript = false;
            /**
             * @type {JQuery}
             */
            $container;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.transaction.script = this.transaction.script || '';
                this.$container = $element.find('.js-script-container');
                this.$container.hide();

                ds.api.assets.get(this.transaction.assetId).then(asset => {
                    this.asset = asset;
                    $scope.$apply();
                });

                (this.transaction.id ? Promise.resolve(this.transaction.id) : this.signable.getId())
                    .then(id => {
                        this.id = id;
                        $scope.$apply();
                    });
            }

            toggleScript() {
                this.shownScript = !this.shownScript;
                this.$container.stop(true, true).slideToggle(100);
            }

        }

        return new SetAssetScriptInfo();
    };

    controller.$inject = ['$scope', '$element'];

    angular.module('app.ui').component('wSetAssetScriptInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/set-asset-script/info.html'
    });
})();
