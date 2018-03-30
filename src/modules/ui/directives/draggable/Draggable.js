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

                        const startRect = $element.get(0).getBoundingClientRect();

                        this.$overlay = $('<div class="drag-overlay">');
                        this.delta = { x: 0, y: 0 };
                        this.translation = { x: startRect.left, y: startRect.top };
                        this.id = 0;
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
                        $element.css({
                            transformOrigin: 'left top',
                            willChange: 'transform',
                            zIndex: 40,
                            left: 0,
                            top: 0
                        });
                        document.body.appendChild($element.get(0));
                    }

                    /**
                     * @private
                     */
                    _setHandlers() {
                        this.listenEventEmitter($element, POINTER_EVENTS.START, this._onStart.bind(this));
                        this.listenEventEmitter($(window), 'resize', this.resizeHandler);
                        $scope.$watch(Draggable._getResizeWatchCb(), this.resizeHandler);
                    }

                    /**
                     * @param {MouseEvent|TouchEvent} e
                     * @private
                     */
                    _onStart(e) {
                        const event = this._getDistilledEvent(e);
                        event.preventDefault();

                        if (event.button !== MAIN_MOUSE_BUTTON) {
                            return false;
                        }

                        this.$overlay.insertBefore($element);

                        const rect = $element.get(0).getBoundingClientRect();
                        this.delta.x = e.pageX - rect.left;
                        this.delta.y = e.pageY - rect.top;

                        this.listenEventEmitter($document, POINTER_EVENTS.MOVE, this.moveHandler);
                        this.listenEventEmitter($document, POINTER_EVENTS.END, this._onEnd.bind(this));
                    }

                    /**
                     * @param {IDistilledEvent} e
                     * @private
                     */
                    _onMove(e) {
                        const rect = $element.get(0).getBoundingClientRect();
                        const x = e.pageX - this.delta.x;
                        const y = e.pageY - this.delta.y;

                        this._updateTranslation(rect, { x, y });
                        this._draw();
                    }

                    /**
                     * @private
                     */
                    _onResize() {
                        const rect = $element.get(0).getBoundingClientRect();

                        this._updateTranslation(rect);
                        this._draw();
                    }

                    /**
                     * @private
                     */
                    _onEnd() {
                        this.stopListenEventEmitter(POINTER_EVENTS.MOVE, $document);
                        this.stopListenEventEmitter(POINTER_EVENTS.END, $document);
                    }

                    /**
                     * @param {ClientRect} rect
                     * @param {{x: number, y: number}} [coordinates]
                     * @private
                     */
                    _updateTranslation(rect, coordinates = { x: rect.left, y: rect.top }) {
                        this.translation.x = Math.min(Math.max(coordinates.x, 0), innerWidth - rect.width);
                        this.translation.y = Math.min(Math.max(coordinates.y, 0), innerHeight - rect.height);
                    }

                    /**
                     * @param {MouseEvent|TouchEvent} e
                     * @return {IDistilledEvent}
                     * @private
                     */
                    _getDistilledEvent(e) {
                        const touch = this._getTouch(e.originalEvent);
                        return {
                            preventDefault: () => e.originalEvent.preventDefault(),
                            button: e.button || MAIN_MOUSE_BUTTON,
                            pageX: Draggable._getCoordinateValue(e, touch, 'pageX'),
                            pageY: Draggable._getCoordinateValue(e, touch, 'pageY')
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
                                this.id = event.targetTouches[0].identifier;
                                return this._getTouchEventById(event);
                            case TOUCH_EVENTS.MOVE:
                                return this._getTouchEventById(event);
                            case TOUCH_EVENTS.END:
                                this.id = 0;
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
                            .call(event.targetTouches, ({ identifier }) => identifier === this.id)[0];
                    }

                    /**
                     * @private
                     */
                    _draw() {
                        $element.css('transform', `translate(${this.translation.x}px, ${this.translation.y}px)`);
                    }

                    static _getResizeWatchCb() {
                        /**
                         * @type {HTMLElement}
                         */
                        const element = $element.get(0);
                        return () => `${element.clientWidth} / ${element.clientHeight}`;
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

