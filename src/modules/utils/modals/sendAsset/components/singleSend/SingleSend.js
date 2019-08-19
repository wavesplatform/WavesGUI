(function () {
    'use strict';

    const controller = function () {

        class SingleSend {

            /**
             * @type {ISendMode}
             */
            sendMode = 'waves';

            constructor() {
                this.test = 0;
            }

            onChangeMode(mode) {
                this.sendMode = mode;
            }

        }

        return new SingleSend();
    };

    controller.$inject = [];

    angular.module('app.ui').component('wSingleSend', {
        bindings: {
            state: '<',
            onContinue: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/singleSend/single-send.html',
        transclude: true,
        controller
    });
})();

/**
 * @typedef {string} ISendMode = waves | bank | gateway
 */
