(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @return {{scope: boolean, link: function(*, *=)}}
     */
    const directive = (utils) => {

        return {
            scope: false,
            link: ($scope, $element) => {

                const $document = $(document);
                const position = $element.css('position');
                const $block = $('<div class="drag-overlay">');

                if (position === 'static' || position === 'relative') {
                    const offset = $element.offset();
                    $element.css({
                        position: 'absolute',
                        transformOrigin: 'left top',
                        willChange: 'transform'
                    });
                    $element.offset(offset);
                }

                $element.css('zIndex', 10);

                document.body.appendChild($element.get(0));
                const stop = $scope.$on('$destroy', () => {
                    stop();
                    $element.remove();
                    $block.remove();
                });

                let x = 0;
                let y = 0;

                $element.on('mousedown', (e) => {
                    e.preventDefault();
                    $block.insertBefore($element);
                    const startX = e.pageX - x;
                    const startY = e.pageY - y;

                    const move = utils.debounceRequestAnimationFrame((e) => {
                        e.preventDefault();
                        x = (e.pageX - startX);
                        y = (e.pageY - startY);
                        $element.css('transform', `translate(${x}px, ${y}px)`);
                    });

                    const up = () => {
                        e.preventDefault();
                        $block.detach();
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

    directive.$inject = ['utils'];

    angular.module('app.ui').directive('wDraggable', directive);

})();

