/* eslint-disable no-fallthrough */
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
                const $overlay = $('<div class="drag-overlay">');

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
                    $overlay.remove();
                });

                let x = 0;
                let y = 0;

                function getEvent(event) {
                    const touch = getTouch(event.originalEvent);
                    return {
                        preventDefault: () => event.originalEvent.preventDefault(),
                        pageX: event.pageX || touch.pageX,
                        pageY: event.pageY || touch.pageY,
                        button: event.button == null ? 0 : event.button
                    };
                }

                let id = 0;

                /**
                 * @param {TouchEvent} event
                 */
                function getTouch(event) {
                    switch (event.type) {
                        case 'touchstart':
                            id = event.targetTouches[0].identifier;
                        case 'touchmove':
                            return Array.prototype.filter
                                .call(event.targetTouches, ({ identifier }) => identifier === id)[0];
                        case 'touchend':
                            id = 0;
                            return event.changedTouches[0];
                        default:
                            return null;
                    }
                }

                $element.on('mousedown touchstart', (e) => {
                    e = getEvent(e);
                    $overlay.insertBefore($element);
                    const startX = e.pageX - x;
                    const startY = e.pageY - y;

                    const handler = utils.debounceRequestAnimationFrame((e) => {
                        e = getEvent(e);
                        x = (e.pageX - startX);
                        y = (e.pageY - startY);
                        $element.css('transform', `translate(${x}px, ${y}px)`);
                    });
                    const move = (e) => {
                        e.preventDefault();
                        handler(e);
                    };

                    const up = () => {
                        $overlay.detach();
                        $document.off('mousemove touchmove', move);
                        $document.off('mouseup touchend', up);
                    };

                    if (e.button === 0) {
                        $document.on('mousemove touchmove', move);
                        $document.on('mouseup touchend', up);
                    }
                });

            }
        };
    };

    directive.$inject = ['utils'];

    angular.module('app.ui').directive('wDraggable', directive);

})();

