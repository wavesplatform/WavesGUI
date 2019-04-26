(function () {
    'use strict';

    const controller = function () {

        class SetScript {

            /**
             * {object}
             */
            props = null;

            $postLink() {
                this.typeName = this.props.typeName;
            }

        }

        return new SetScript();
    };

    angular.module('app.ui').component('wSetScript', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/set-script/set-script.html',
        controller
    });
})();
