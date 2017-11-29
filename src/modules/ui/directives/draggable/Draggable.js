(function () {
    'use strict';

    const directive = (Base) => {

        return {
            scope: true,
            link: ($scope, $element) => {

                const position = $element.css('position');
                if (position === 'static' || position === 'relative') {
                    const offset = $element.offset();
                    $element.css('position', 'absolute');
                    $element.offset(offset);
                }
                const $document = $(document);

                $element.on('mousedown', (e) => {
                    const startX = e.pageX;
                    const startY = e.pageY;

                    const move = (e) => {
                        $element.css({
                            left: `${e.pageX - startX}px`,
                            top: `${e.pageY - startY}px`
                        });
                    };

                    const up = () => {
                        $document.off('mousemove', move);
                        $document.off('mouseup', up);
                    };

                    $document.on('mousemove', move);
                    $document.on('mouseup', up);
                });

            }
        };
    };

    directive.$inject = ['Base'];

    angular.module('app.ui').directive('wDraggable', directive);

})();

