(function () {
    'use strict';

    /**
     * @param Base
     * @returns {MatcherSelect}
     */
    const controller = function (Base, i18n) {

        const MATCHER_LIST = [
            {
                url: 'https://matcher.wavesplatform.com/matcher',
                name: 'SUPER LEGAL MATCHER',
                terms: 'Some text'
            },
            {
                url: 'https://matcher.123.com/matcher',
                name: 'SUPER ILLEGAL MATCHER',
                terms: 'Some text'
            }
        ];

        class MatcherSelect extends Base {

            /**
             * @public
             */
            matcherList = [];

            constructor() {
                super();

                this.matcherList = MATCHER_LIST.concat({
                    custom: true,
                    name: i18n.translate('modal.matcherChoice.customMatcher', 'app.utils')
                });

                this.observe('active', () => {
                    this.onChange({ matcher: this.active });
                });
            }

        }

        return new MatcherSelect();
    };

    controller.$inject = ['Base', 'i18n'];

    angular.module('app.ui').component('wMatcherSelect', {
        bindings: {
            onChange: '&'
        },
        templateUrl: 'modules/ui/directives/matcherSelect/matcherSelect.html',
        transclude: false,
        controller
    });
})();
