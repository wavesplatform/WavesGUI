(function () {
    'use strict';

    const controller = function () {

        class Data {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                this.typeName = this.props.typeName;
                this.subheaderParams = {
                    time: this.props.time
                };
            }

        }

        return new Data();
    };

    angular.module('app.ui').component('wData', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/data/script-invocation.html',
        controller
    });
})();
