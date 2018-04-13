/* eslint-disable no-fallthrough */
(function () {
    'use strict';

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
     * @param {JQuery} $document
     * @param {Base} Base
     * @return {*}
     */
    const directive = (utils, $document, Base) => {

        return {
            scope: false,
            link: ($scope, $element) => {

                class Draggable extends Base {

                    constructor() {
                        super($scope);

                        const element = $element.get(0);
                        const startRect = element.getBoundingClientRect();

                        this.x = startRect.left;
                        this.y = startRect.top;
                        this.delta = { x: 0, y: 0 };
                        this.touchId = 0;
                        this.element = element;
                        this.$overlay = $('<div class="drag-overlay">');
                        this.moveHandler = this._getMoveHandler();
                        this.resizeHandler = utils.debounceRequestAnimationFrame(() => this._onResize());

                        this._initializeElementPosition();
                        this._setHandlers();
                        this._draw();
                    }

                    $onDestroy() {
                        super.$onDestroy();
                        $element.remove();
                    }

                    /**
                     * @private
                     */
                    _initializeElementPosition() {
                        const position = $element.css('position');
                        if (position === 'static' || position === 'relative') {
                            $element.css('position', 'absolute');
                        }
                        $element.addClass('drag-element');
                        document.body.appendChild(this.element);
                    }

                    /**
                     * @private
                     */
                    _setHandlers() {
                        this.listenEventEmitter($element, POINTER_EVENTS.START, (e) => this._onStart(e));
                        this.listenEventEmitter($(window), 'resize', this.resizeHandler);
                        $scope.$watch(() => this._getElementSize(), this.resizeHandler);
                    }

                    /**
                     * @param {MouseEvent|TouchEvent} e
                     * @private
                     */
                    _onStart(e) {
                        const event = this._getDistilledEvent(e);
                        // Disallow text selection, but allow clicking for touch devices.
                        if (event.type !== TOUCH_EVENTS.START) {
                            event.preventDefault();
                        }

                        if (event.button !== MAIN_MOUSE_BUTTON) {
                            return false;
                        }

                        this.$overlay.insertBefore($element);

                        const rect = this.element.getBoundingClientRect();
                        this.delta.x = event.pageX - rect.left;
                        this.delta.y = event.pageY - rect.top;

                        this.listenEventEmitter($document, POINTER_EVENTS.MOVE, this.moveHandler);
                        this.listenEventEmitter($document, POINTER_EVENTS.END, () => this._onEnd());
                    }

                    /**
                     * @param {IDistilledEvent} e
                     * @private
                     */
                    _onMove(e) {
                        const rect = this.element.getBoundingClientRect();
                        const x = e.pageX - this.delta.x;
                        const y = e.pageY - this.delta.y;

                        this._updateTranslation(rect, { x, y });
                        this._draw();
                    }

                    /**
                     * @private
                     */
                    _onResize() {
                        const rect = this.element.getBoundingClientRect();

                        this._updateTranslation(rect);
                        this._draw();
                    }

                    /**
                     * @private
                     */
                    _onEnd() {
                        this.$overlay.detach();
                        this.stopListenEventEmitter(POINTER_EVENTS.MOVE, $document);
                        this.stopListenEventEmitter(POINTER_EVENTS.END, $document);
                    }

                    /**
                     * @param {ClientRect} rect
                     * @param {{x: number, y: number}} [coordinates]
                     * @private
                     */
                    _updateTranslation(rect, coordinates = { x: rect.left, y: rect.top }) {
                        const min = 0;
                        this.x = Draggable._getValueInRange({
                            min,
                            max: innerWidth - rect.width,
                            value: coordinates.x
                        });
                        this.y = Draggable._getValueInRange({
                            min,
                            max: innerHeight - rect.height,
                            value: coordinates.y
                        });
                    }

                    /**
                     * @param {MouseEvent|TouchEvent|JQuery.Event<any, any>} e
                     * @return {IDistilledEvent}
                     * @private
                     */
                    _getDistilledEvent(e) {
                        const touch = this._getTouch(e.originalEvent);
                        return {
                            preventDefault: () => e.originalEvent.preventDefault(),
                            button: e.button || MAIN_MOUSE_BUTTON,
                            pageX: Draggable._getCoordinateValue(e, touch, 'pageX'),
                            pageY: Draggable._getCoordinateValue(e, touch, 'pageY'),
                            type: e.type
                        };
                    }

                    /**
                     * @return {function}
                     * @private
                     */
                    _getMoveHandler() {
                        return utils.debounceRequestAnimationFrame((e) => {
                            return this._onMove(this._getDistilledEvent(e));
                        });
                    }

                    /**
                     * @param {TouchEvent} event
                     * @return {*}
                     * @private
                     */
                    _getTouch(event) {
                        switch (event.type) {
                            case TOUCH_EVENTS.START:
                                this.touchId = event.targetTouches[0].identifier;
                                return this._getTouchEventById(event);
                            case TOUCH_EVENTS.MOVE:
                                return this._getTouchEventById(event);
                            case TOUCH_EVENTS.END:
                                this.touchId = 0;
                                return event.changedTouches[0];
                            default:
                                return {};
                        }
                    }

                    /**
                     * @param event
                     * @return {Touch}
                     * @private
                     */
                    _getTouchEventById(event) {
                        return Array.prototype.filter
                            .call(event.targetTouches, ({ identifier }) => identifier === this.touchId)[0];
                    }

                    /**
                     * @private
                     */
                    _draw() {
                        $element.css('transform', `translate(${this.x}px, ${this.y}px)`);
                    }

                    /**
                     * @returns {string}
                     * @private
                     */
                    _getElementSize() {
                        return `${this.element.clientWidth} / ${this.element.clientHeight}`;
                    }

                    /**
                     * @param {object} parameters
                     * @param {number} parameters.min
                     * @param {number} parameters.max
                     * @param {number} parameters.value
                     * @returns {number}
                     * @private
                     */
                    static _getValueInRange(parameters) {
                        const { min, max, value } = parameters;
                        return Math.min(Math.max(value, min), max);
                    }

                    static _getCoordinateValue(event, touch, coordinate) {
                        if (typeof event[coordinate] !== 'number') {
                            return touch[coordinate];
                        }

                        return event[coordinate];
                    }

                }

                new Draggable();

            }
        };
    };

    directive.$inject = ['utils', '$document', 'Base'];

    angular.module('app.ui').directive('wDraggable', directive);

})();

/**
 * @typedef {object} IDistilledEvent
 * @property {Function } preventDefault
 * @property {number} button
 * @property {number} pageX
 * @property {number} pageY
 */

