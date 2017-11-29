(function () {
    'use strict';

    const directive = (Base) => {

        return {
            scope: true,
            require: null,
            transclude: false,
            template: 'modules/ui/directives/draggable/draggable.html',
            link: ($scope, $element, $attrs) => {

                class Draggable extends Base {

                    constructor() {
                        super($scope);

                    }

                }

                new Draggable();
            }
        };
    };

    directive.$inject = ['Base'];

    angular.module('app.').directive('wDraggable', directive);

})();

