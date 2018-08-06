(function () {
    'use strict';

    /**
     * @param Base
     * @return {ImportCtrl}
     */
    const controller = function (Base, $scope) {

        class ImportCtrl extends Base {

            constructor() {
                super($scope);
            }

            getLink({ type }) {
                switch (type) {
                    case 'seed':
                        return 'restore';
                    default:
                        return `${type}`;
                }

            }

        }

        return new ImportCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.import').controller('ImportCtrl', controller);
})();
