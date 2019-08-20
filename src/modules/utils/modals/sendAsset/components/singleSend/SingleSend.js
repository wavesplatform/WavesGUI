(function () {
    'use strict';

    const controller = function () {

        class SingleSend {

            /**
             * @type {ISendMode}
             */
            sendMode = 'waves';

            onChangeMode(mode) {
                this.sendMode = mode;
            }

            onSign(signable) {
                this.onContinue({ signable });
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
