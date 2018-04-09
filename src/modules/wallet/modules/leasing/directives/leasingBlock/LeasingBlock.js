(function () {
    'use strict';

    /**
     * @param Base
     * @param {app.i18n} i18n
     * @param $attrs
     * @return {LeasingBlock}
     */
    const controller = function (Base, i18n, $attrs, $element) {

        class LeasingBlock extends Base {

            constructor() {
                super();
                this.titleLiteral = $attrs.titleLocale;
                i18n.translateField(this, 'titleLiteral', 'title', i18n.getNs($element));
            }

        }

        return new LeasingBlock();
    };

    controller.$inject = ['Base', 'i18n', '$attrs', '$element'];

    angular.module('app.wallet.leasing').component('wLeasingBlock', {
        bindings: {
            titleLocale: '@'
        },
        templateUrl: 'modules/wallet/modules/leasing/directives/leasingBlock/leasingBlock.html',
        transclude: true,
        controller
    });
})();
