(function () {
    'use strict';

    /**
     * @param {$rootScope.Scope} $scope
     * @param {JQuery} $element
     * @return {DataInfo}
     */
    const controller = function ($scope, $element) {

        class DataInfo {

            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {string}
             */
            json;
            /**
             * @type {boolean}
             */
            dataVisible = false;
            /**
             * @type {boolean}
             */
            allVisible = false;


            $postLink() {
                this.transaction = this.signable.getTxData();
                this.signable.getDataForApi().then(json => {
                    this.json = WavesApp.stringifyJSON(json, null, 4);
                });
                (this.transaction.id ? Promise.resolve(this.transaction.id) : this.signable.getId())
                    .then(id => {
                        this.id = id;
                        $scope.$apply();
                    });
            }

            /**
             * @public
             */
            toggleAll() {
                this.allVisible = !this.allVisible;
                $element.find('.transaction-details__list').stop().animate({ scrollTop: 0 }, 300);
            }

            /**
             * @public
             */
            toggleVisible() {
                this.allVisible = false;
                this.dataVisible = !this.dataVisible;
            }

        }

        return new DataInfo();
    };

    controller.$inject = ['$scope', '$element'];

    angular.module('app.ui').component('wDataInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/data/data-info.html'
    });
})();
