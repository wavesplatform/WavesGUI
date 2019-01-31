(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @param {JQuery} $element
     * @return {IssueInfo}
     */
    const controller = function ($scope, $element) {

        class IssueInfo {

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
                this.$container = $element.find('.js-script-container');
                this.$container.hide();
                this.transaction = this.signable.getTxData();
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

        return new IssueInfo();
    };

    controller.$inject = ['$scope', '$element'];

    angular.module('app.ui').component('wIssueInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/issue/issue-info.html'
    });
})();
