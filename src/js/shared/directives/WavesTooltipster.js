(function () {
    'use strict';

    angular
        .module(`app.shared`)
        .directive(`tooltipster`, [`constants.tooltip`, function WavesTooltipster(constants) {

            return {
                restrict: `A`,
                link: function (scope, element, attributes) {

                    let text;
                    if (angular.isDefined(attributes.title)) {
                        text = attributes.title;
                    } else if (angular.isDefined(attributes.tooltipTitle)) {
                        text = attributes.tooltipTitle;
                    }

                    if (angular.isUndefined(text)) {
                        throw new Error(`Tooltip text is undefined. Tooltipster is not needed for element: ${element}`);
                    }

                    const tooltipOptions = _.clone(constants);
                    if (angular.isDefined(attributes.tooltipTheme)) {
                        tooltipOptions.theme = attributes.tooltipTheme;
                    }

                    tooltipOptions.content = text;

                    if (angular.isDefined(attributes.tooltipHtml) || attributes.tooltipHtml === true) {
                        tooltipOptions.contentAsHTML = true;
                    }

                    element.tooltipster(tooltipOptions);

                    scope.$on(`$destroy`, function DestroyTooltip() {
                        element.tooltipster(`destroy`);
                    });
                }
            };
        }]);
})();
