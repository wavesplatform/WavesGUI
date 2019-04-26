(function () {
    'use strict';

    const controller = function () {

        class CreateAlias {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                this.typeName = this.props.typeName;
                this.subheaderParams = {
                    time: this.props.time,
                    alias: this.props.alias
                };
            }

        }

        return new CreateAlias();
    };

    angular.module('app.ui').component('wCreateAlias', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/create-alias/create-alias.html',
        controller
    });
})();
