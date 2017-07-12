(function () {
    'use strict';

    angular
        .module(`app.shared`)
        .directive(`focusMe`, [`$timeout`, function WavesFocus($timeout) {
            return {
                restrict: `A`,
                link: function (scope, element, attributes) {
                    scope.$watch(attributes.focusMe, (newValue) => {
                        $timeout(() => newValue && element[0].focus());
                    }, true);
                }
            };
        }]);
})();
