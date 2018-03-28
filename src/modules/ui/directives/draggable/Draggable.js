/* eslint-disable no-fallthrough */
(function () {
    'use strict';

    const PAGE_COORDINATES = {
        x: 'pageX',
        y: 'pageY'
    };

    const MOUSE_EVENTS = {
        DOWN: 'mousedown',
        MOVE: 'mousemove',
        UP: 'mouseup'
    };

    const TOUCH_EVENTS = {
        START: 'touchstart',
        MOVE: 'touchmove',
        END: 'touchend'
    };

    const POINTER_EVENTS = {
        START: `${MOUSE_EVENTS.DOWN} ${TOUCH_EVENTS.START}`,
        MOVE: `${MOUSE_EVENTS.MOVE} ${TOUCH_EVENTS.MOVE}`,
        END: `${MOUSE_EVENTS.UP} ${TOUCH_EVENTS.END}`
    };

    const MAIN_MOUSE_BUTTON = 0;

    /**
     * @param {app.utils} utils
     * @return {{scope: boolean, link: function(*, *=)}}
     */
    const directive = (utils) => {

        return {
            scope: false,
            link: ($scope, $element) => {

                const $document = $(document);
                const jWindow = $(window);
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

                const translation = {
                    x: 0,
                    y: 0
                };

                let translationLimits = {
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0
                };

                const initialOffset = {
                    x: $element.offset().left,
                    y: $element.offset().top
                };

                let id = 0;

                $scope.$watch(() => $element.width(), updateTranslationLimits);
                $scope.$watch(() => $element.height(), updateTranslationLimits);

                $element.on(POINTER_EVENTS.START, (startEvent) => {
                    $overlay.insertBefore($element);

                    startEvent = getDistilledEvent(startEvent);
                    if (mainMouseButtonUsed(startEvent)) {
                        updateTranslationLimits();
                        const onMove = getMoveHandler(startEvent);
                        $document.on(POINTER_EVENTS.MOVE, onMove);
                        $document.one(POINTER_EVENTS.END, getPointerEndHandler(onMove));
                    }
                });

                function getDistilledEvent(event) {
                    const touch = getTouch(event.originalEvent);
                    const distilledEvent = {
                        preventDefault: () => event.originalEvent.preventDefault(),
                        button: event.button || MAIN_MOUSE_BUTTON
                    };

                    Object.values(PAGE_COORDINATES).forEach((coordinate) => {
                        distilledEvent[coordinate] = getCoordinateValue(event, touch, coordinate);
                    });

                    return distilledEvent;
                }

                /**
                 * @param {TouchEvent} event
                 */
                function getTouch(event) {
                    switch (event.type) {
                        case TOUCH_EVENTS.START:
                            id = event.targetTouches[0].identifier;
                        case TOUCH_EVENTS.MOVE:
                            return Array.prototype.filter
                                .call(event.targetTouches, ({ identifier }) => identifier === id)[0];
                        case TOUCH_EVENTS.END:
                            id = 0;
                            return event.changedTouches[0];
                        default:
                            return {};
                    }
                }

                function getCoordinateValue(event, touch, coordinate) {
                    if (typeof event[coordinate] !== 'number') {
                        return touch[coordinate];
                    }

                    return event[coordinate];
                }

                function mainMouseButtonUsed(event) {
                    return event.button === MAIN_MOUSE_BUTTON;
                }

                function updateTranslationLimits() {
                    const scroll = {
                        x: jWindow.scrollLeft(),
                        y: jWindow.scrollTop()
                    };

                    translationLimits = {
                        left: scroll.x - initialOffset.x,
                        right: scroll.x + jWindow.width() - (initialOffset.x + $element.width()),
                        top: scroll.y - initialOffset.y,
                        bottom: scroll.y + jWindow.height() - (initialOffset.y + $element.height())
                    };
                }

                function getMoveHandler(startEvent) {
                    const setTranslation = buildTranslationSetter(startEvent);

                    return (moveEvent) => {
                        moveEvent.preventDefault();
                        setTranslation(moveEvent);
                    };
                }

                function buildTranslationSetter(startEvent) {
                    const start = calculateStartCoordinates(startEvent);

                    return utils.debounceRequestAnimationFrame((moveEvent) => {
                        moveEvent = getDistilledEvent(moveEvent);
                        updateTranslationCoordinates(moveEvent, start);
                        $element.css('transform', `translate(${translation.x}px, ${translation.y}px)`);
                    });
                }

                function calculateStartCoordinates(startEvent) {
                    const start = {};

                    updateCoordinates(start, startEvent, translation);

                    return start;
                }

                function updateTranslationCoordinates(moveEvent, start) {
                    updateCoordinates(translation, moveEvent, start);
                    translation.x = getBoundedValue(translationLimits.left, translation.x, translationLimits.right);
                    translation.y = getBoundedValue(translationLimits.top, translation.y, translationLimits.bottom);
                }

                function updateCoordinates(coordinatesToUpdate, event, basicCoordinates) {
                    Object.keys(PAGE_COORDINATES).forEach((coordinate) => {
                        const eventCoordinate = event[PAGE_COORDINATES[coordinate]];
                        coordinatesToUpdate[coordinate] = eventCoordinate - basicCoordinates[coordinate];
                    });
                }

                function getBoundedValue(lowerBound, value, upperBound) {
                    return Math.min(
                        Math.max(
                            lowerBound,
                            value
                        ),
                        upperBound
                    );
                }

                function getPointerEndHandler(onMove) {
                    return () => {
                        $overlay.detach();
                        $document.off(POINTER_EVENTS.MOVE, onMove);
                    };
                }

            }
        };
    };

    directive.$inject = ['utils'];

    angular.module('app.ui').directive('wDraggable', directive);

})();

