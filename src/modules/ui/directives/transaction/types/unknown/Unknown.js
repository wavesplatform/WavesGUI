(function () {
    'use strict';

    const controller = function () {

        class Unknown {

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

        return new Unknown();
    };

    angular.module('app.ui').component('wUnknown', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/unknown/unknown.html',
        controller
    });
})();
