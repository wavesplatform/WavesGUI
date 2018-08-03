(function () {
    'use strict';

    const signatureAdapter = require('@waves/waves-signature-adapter');

    /**
     * @param Base
     * @return {ImportCtrl}
     */
    const controller = function (Base, $scope) {

        class ImportCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {(SeedAdapter | LedgerAdapter)[]}
                 */
                this.importTypes = signatureAdapter.adapterList;
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
