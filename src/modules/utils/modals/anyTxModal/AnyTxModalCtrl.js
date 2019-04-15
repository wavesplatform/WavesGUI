(function () {
    'use strict';

    const controller = function (Base, $scope) {

        const analytics = require('@waves/event-sender');

        class AnyTxModalCtrl extends Base {

            /**
             * @param {object}
             * @type {null}
             */
            state = null;
            /**
             * @type {null}
             */
            signable = null;
            /**
             * @type {number}
             */
            step = 0;


            constructor({ tx, analyticsText }) {
                super($scope);
                this.analyticsText = analyticsText;
                this.state = { tx };
            }

            onFillTxForm(signable) {
                if (this.analyticsText) {
                    analytics.send({ name: this.analyticsText, target: 'ui' });
                }
                this.signable = signable;
                this.step++;
            }

            onConfirmBack() {
                this.step--;
            }

        }

        return new AnyTxModalCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('AnyTxModalCtrl', controller);
})();
