(function () {
    'use strict';

    const directive = (Base) => {

        return {
            scope: false,
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
                    const x = parseInt($element.css('left'), 10);
                    const y = parseInt($element.css('top'), 10);

                    const move = (e) => {
                        e.preventDefault();
                        $element.css({
                            left: `${x + (e.pageX - startX)}px`,
                            top: `${y + (e.pageY - startY)}px`
                        });
                    };

                    const up = () => {
                        e.preventDefault();
                        $document.off('mousemove', move);
                        $document.off('mouseup', up);
                    };

                    if (e.button === 0) {
                        $document.on('mousemove', move);
                        $document.on('mouseup', up);
                    }
                });

            }
        };
    };

    directive.$inject = ['Base'];

    angular.module('app.ui').directive('wDraggable', directive);

})();

