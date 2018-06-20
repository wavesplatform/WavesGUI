{
    class controller {

        constructor() {
            /**
             * @type {Function}
             */
            this.handleClick = angular.noop;

            /**
             * @type {boolean}
             */
            this.isHovered = false;
        }

        setHovered() {
            this.isHovered = true;
        }

        setNotHovered() {
            this.isHovered = false;
        }

    }

    angular.module('app.dex')
        .component('wDexLayoutSideBarToggle', {
            bindings: {
                handleClick: '&',
                side: '@'
            },
            templateUrl: 'modules/dex/directives/layout/DexLayoutSideBarToggle.html',
            controller
        });
}
