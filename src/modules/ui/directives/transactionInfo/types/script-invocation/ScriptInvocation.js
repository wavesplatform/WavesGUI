(function () {
    'use strict';

    /**
     * @param {JQuery} $element
     * @return {DataInfo}
     */
    const controller = function ($element) {

        class DataInfo {

            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {boolean}
             */
            dataVisible = false;
            /**
             * @type {boolean}
             */
            allVisible = false;
            /**
             * @type {string}
             */
            function;
            /**
             * @type {string}
             */
            json;
            /**
             * @type {string}
             */
            payment;
            /**
             * @type {string}
             */
            args;


            $postLink() {
                this.transaction = this.signable.getTxData();
                (this.transaction.id ? Promise.resolve(this.transaction.id) : this.signable.getId())
                    .then(id => {
                        this.id = id;
                    });

                this.json = JSON.stringify(this.transaction.call && this.transaction.call.args || [], null, 4);
                if (this.transaction.payment.length > 0) {
                    const payment = this.transaction.payment[0];
                    this.payment = `${payment.getTokens().toFormat()} ${payment.asset.displayName}`;
                }
                if (this.transaction.call) {
                    this.args = this.transaction.call.args;
                }
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

    controller.$inject = ['$element'];

    angular.module('app.ui').component('wScriptInvocationInfo', {
        bindings: {
            signable: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/types/script-invocation/script-invocation-info.html'
    });
})();
