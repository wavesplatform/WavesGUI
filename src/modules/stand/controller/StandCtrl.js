(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @return {StandCtrl}
     */
    const controller = function (Base, $scope) {

        class StandCtrl extends Base {

            constructor() {
                super($scope);
                this.invalid = true;
                this.warning = true;
                this.success = true;
                this.error = true;
                this.active = true;
                this.inactive = true;

                // this.observeOnce('form', () => {
                //     this.form.invalid.$setTouched(true);
                // });
            }

        }

        return new StandCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.stand').controller('StandCtrl', controller);
})();
