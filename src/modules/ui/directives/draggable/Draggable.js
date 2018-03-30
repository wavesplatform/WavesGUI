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
     * @param $document
     * @return {{scope: boolean, link: function(*, *=)}}
     */
    const directive = (utils, $document) => {

        return {
            scope: false,
            link: ($scope, $element) => {

                const $window = $(window);
                const $overlay = $('<div class="drag-overlay">');

                let translation = {
                    x: 0,
                    y: 0
                };

                const initialOffset = {
                    x: 0,
                    y: 0
                };

                let bounds = {
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0
                };

                let id = 0;

                init();

                function init() {
                    const position = $element.css('position');
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

                    updateCoordinatesAndInscribeElement();

                    const stop = $scope.$on('$destroy', () => {
                        stop();
                        $element.remove();
                        $overlay.remove();
                    });

                    $scope.$watch(() => $element.width(), updateBoundsAndInscribeElement);
                    $scope.$watch(() => $element.height(), updateBoundsAndInscribeElement);
                    $window.resize(updateCoordinatesAndInscribeElement);
                    $document.scroll(updateCoordinates);

                    $element.on(POINTER_EVENTS.START, (startEvent) => {
                        $overlay.insertBefore($element);

                        startEvent = getDistilledEvent(startEvent);
                        if (startEvent.button === MAIN_MOUSE_BUTTON) {
                            const onMove = getMoveHandler(startEvent);
                            $document.on(POINTER_EVENTS.MOVE, onMove);
                            $document.one(POINTER_EVENTS.END, getPointerEndHandler(onMove));
                        }
                    });
                }

                function updateCoordinatesAndInscribeElement() {
                    updateCoordinates();
                    inscribeElementInBounds();
                }

                function updateCoordinates() {
                    updateInitialOffset();
                    updateBounds();
                }

                function updateBoundsAndInscribeElement() {
                    updateBounds();
                    inscribeElementInBounds();
                }

                function updateInitialOffset() {
                    initialOffset.x = $element.offset().left - translation.x;
                    initialOffset.y = $element.offset().top - translation.y;
                }

                function updateBounds() {
                    const scroll = {
                        x: $window.scrollLeft(),
                        y: $window.scrollTop()
                    };

                    bounds = {
                        left: scroll.x - initialOffset.x,
                        right: scroll.x + window.innerWidth - (initialOffset.x + $element.width()),
                        top: scroll.y - initialOffset.y,
                        bottom: scroll.y + window.innerHeight - (initialOffset.y + $element.height())
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
                    const start = calculateRelativeCoordinates(startEvent, translation);

                    return utils.debounceRequestAnimationFrame((moveEvent) => {
                        moveEvent = getDistilledEvent(moveEvent);
                        translation = calculateRelativeCoordinates(moveEvent, start);
                        inscribeElementInBounds();
                    });
                }

                function calculateRelativeCoordinates(event, basicCoordinates) {
                    const relativeCoordinates = {};

                    Object.keys(PAGE_COORDINATES).forEach((coordinate) => {
                        const eventCoordinate = event[PAGE_COORDINATES[coordinate]];
                        relativeCoordinates[coordinate] = eventCoordinate - basicCoordinates[coordinate];
                    });

                    return relativeCoordinates;
                }

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
                            return getTouchEventById(event);
                        case TOUCH_EVENTS.MOVE:
                            return getTouchEventById(event);
                        case TOUCH_EVENTS.END:
                            id = 0;
                            return event.changedTouches[0];
                        default:
                            return {};
                    }
                }

                function getTouchEventById(event) {
                    return Array.prototype.filter.call(event.targetTouches, ({ identifier }) => identifier === id)[0];
                }

                function getCoordinateValue(event, touch, coordinate) {
                    if (typeof event[coordinate] !== 'number') {
                        return touch[coordinate];
                    }

                    return event[coordinate];
                }

                function inscribeElementInBounds() {
                    translation.x = getBoundedValue(bounds.left, translation.x, bounds.right);
                    translation.y = getBoundedValue(bounds.top, translation.y, bounds.bottom);
                    $element.css('transform', `translate(${translation.x}px, ${translation.y}px)`);
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

    directive.$inject = ['utils', '$document'];

    angular.module('app.ui').directive('wDraggable', directive);

})();

