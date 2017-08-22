(function () {
    'use strict';

    const AVAILABLE_TYPES = [
        'read',
        'random',
        'write'
    ];

    const TARGET_SCALE = 0.6;
    const ANIMATION_TIME = 300;

    const controller = function ($element, $scope, $q) {

        class Seed {

            constructor() {
                /**
                 * @type {string}
                 */
                this.type = null;
                /**
                 * @type {string}
                 */
                this.seed = null;
                /**
                 * @type {Array}
                 */
                this.parts = null;
                /**
                 * @type {Array}
                 */
                this.hiddenParts = null;
                /**
                 * @type {string}
                 */
                this.url = null;
            }

            $postLink() {
                if (!this.seed) {
                    throw new Error('No seed!');
                }

                if (!AVAILABLE_TYPES.includes(this.type)) {
                    throw new Error('Wrong type!');
                }

                this._initialize();
            }

            getClass(index) {
                if (this.type === 'write') {
                    return this.parts[index].trim() ? 'full' : 'empty';
                } else {
                    return '';
                }
            }

            /**
             * @private
             */
            _initialize() {
                this.hiddenParts = this.seed.split(' ');
                switch (this.type) {
                    case 'random':
                        this.parts = this.seed.split(' ');
                        this._initializeRandom();
                        break;
                    case 'write':
                        this._initializeWrite();
                        break;
                    default:
                        this.parts = this.seed.split(' ');
                }
            }

            /**
             * @private
             */
            _initializeRandom() {
                this._mixSeed();
                this._setRandomHandlers();
            }

            /**
             * @private
             */
            _setRandomHandlers() {

                $element.find('.seed-container').on('mousedown', '.seed-item', (e) => {
                    const elements = this._getParts();

                    const $target = $(e.target);

                    if ($target.hasClass('moved')) {
                        return null;
                    }

                    const index = elements.indexOf($target.get(0));
                    const $clone = Seed.createClone($target, { mouseX: e.pageX, mouseY: e.pageY });

                    controller.dragData.active = {
                        index: this.hiddenParts.indexOf(this.parts[index]),
                        $node: $clone
                    };

                    $target.addClass('moved');

                    Seed.getDragHandlers($target, $clone, (e) => {
                        $clone.css({
                            top: e.pageY,
                            left: e.pageX
                        });
                    }, () => {
                        if (controller.dragData.active) {
                            controller.dragData.active = null;
                            Seed.removeClone($target, $clone);
                        }
                    });
                });
            }

            /**
             * @private
             */
            _mixSeed() {
                for (let i = 0; i < 10; i++) {
                    this.parts.sort(() => {
                        const num = Math.random();
                        return num < 0.33 ? -1 : num > 0.66 ? 1 : 0;
                    });
                }
            }

            /**
             * @private
             */
            _initializeWrite() {
                this.parts = this.hiddenParts.map(() => ' ');
                this._setWriteHandlers();
            }

            /**
             * @private
             */
            _setWriteHandlers() {
                const $container = $element.find('.seed-container');
                let myMove = false;

                $container.on('mouseup', '.seed-item', (e) => {
                    const elements = this._getParts();

                    if (!myMove && controller.dragData.active != null) {

                        const index = elements.indexOf(e.target);
                        const moveIndex = controller.dragData.active.index;
                        const $clone = controller.dragData.active.$node;
                        const $element = $(e.target);

                        if ($element.hasClass('full')) {
                            Seed.itemGoHome($element);
                        }

                        Seed.removeClone($element, $clone).then(() => {

                            this.parts[index] = this.hiddenParts[moveIndex];

                            if (this.parts.every((text) => Boolean(text.trim()))) {
                                this._validate();
                            }
                        });

                        controller.dragData.active = null;
                    }
                });

                $container.on('mousedown', '.seed-item.full', (e) => {
                    const elements = this._getParts();
                    const $from = $(e.target);
                    const start = elements.indexOf(e.target);
                    const $clone = Seed.createClone($from, {
                        mouseX: e.pageX,
                        mouseY: e.pageY,
                        $home: $from.data('writeCloneFrom')
                    });

                    myMove = true;

                    Seed.getDragHandlers($from, $clone, (e) => {
                        $clone.css({
                            top: e.pageY,
                            left: e.pageX
                        });
                    }, (e) => {
                        myMove = false;
                        if (e.target === $clone.get(0)) {
                            Seed.removeClone($from, $clone);
                            return null;
                        }
                        const end = elements.indexOf(e.target);
                        const $target = $(e.target);

                        if ($target.hasClass('full')) {
                            Seed.itemGoHome($target);
                        }

                        Seed.removeClone($target, $clone).then(() => {
                            this.parts[end] = this.parts[start];
                            this.parts[start] = ' ';
                        });
                    }, (e) => {
                        myMove = false;
                    });

                });
            }

            /**
             * @private
             */
            _validate() {
                if (this.parts.join(' ') !== this.seed) {
                    alert('Wrong seed!'); // TODO ...
                } else {
                    alert('Success!'); // TODO ...
                }
            }

            _getParts() {
                const elements = $element.find('.seed-container')
                    .children()
                    .toArray();
                if (elements && elements.length) {
                    this._getParts = () => elements;
                }
                return elements;
            }

            /**
             * @param {jQuery} $element
             * @param {Object} [detail]
             * @param {number} detail.mouseX
             * @param {number} detail.mouseY
             * @param {jQuery} [detail.$home]
             * @returns {jQuery}
             */
            static createClone($element, detail) {
                const $clone = $element.clone()
                    .removeClass('write')
                    .removeClass('full')
                    .addClass('read');
                const offset = $element.offset();

                detail = detail || { mouseX: offset.left, mouseY: offset.top };

                document.body.appendChild($clone.get(0));
                $clone.addClass('clone');
                $clone.css({
                    position: 'absolute',
                    left: detail.mouseX,
                    top: detail.mouseY,
                    margin: '0',
                    transform: `translate(-${detail.mouseX - offset.left}px, -${detail.mouseY - offset.top}px)`
                });
                $clone.data('copyOf', detail.$home || $element);

                $element.addClass('moved');

                requestAnimationFrame(() => {
                    $clone.css({
                        transform: `translate(5px, 5px) scale(${TARGET_SCALE}, ${TARGET_SCALE})`
                    });
                });

                return $clone;
            }

            /**
             * @param {jQuery} $element
             * @param {jQuery} $clone
             */
            static removeClone($element, $clone) {
                return $q((resolve) => {
                    $element.data('writeCloneFrom', $clone.data('copyOf'));
                    $clone.css('transform', 'translate(0px, 0px) scale(1, 1)');
                    const offset = $element.offset();
                    $clone.animate({
                        left: offset.left,
                        top: offset.top,
                        width: $element.width()
                    }, ANIMATION_TIME, () => {
                        resolve();
                        requestAnimationFrame(() => {
                            $clone.remove();
                            $element.removeClass('moved');
                        });
                    });
                });
            }

            static itemGoHome($element) {
                const $home = $element.data('writeCloneFrom');
                const $clone = Seed.createClone($element);
                Seed.removeClone($home, $clone);
            }

            /**
             * @param {jQuery} $target
             * @param {jQuery} $clone
             * @param {Function} [onMove]
             * @param {Function} [onEnd]
             * @param {Function} [onBlur]
             * @returns {blur}
             */
            static getDragHandlers($target, $clone, onMove, onEnd, onBlur) {

                const move = function (e) {
                    e.preventDefault();
                    if (onMove) {
                        onMove(e);
                    }
                };

                const blur = function (e) {
                    document.removeEventListener('mousemove', move, false);
                    document.removeEventListener('mouseup', up, false);
                    window.removeEventListener('blur', blur, false);
                    controller.dragData.active = null;
                    Seed.removeClone($target, $clone);

                    if (onBlur) {
                        onBlur(e);
                    }
                };

                const up = function (e) {
                    document.removeEventListener('mousemove', move, false);
                    document.removeEventListener('mouseup', up, false);
                    window.removeEventListener('blur', blur, false);
                    if (onEnd) {
                        onEnd(e);
                    }
                };

                window.addEventListener('blur', blur, false);
                document.addEventListener('mousemove', move, false);
                document.addEventListener('mouseup', up, false);
                return blur;
            }

        }


        return new Seed();

    };

    controller.dragData = {
        active: null
    };

    controller.$inject = ['$element', '$scope', '$q'];

    angular.module('app.welcome.getStarted').component('wSeed', {
        bindings: {
            type: '@',
            seed: '@'
        },
        controller: controller,
        templateUrl: 'modules/welcome/modules/getStarted/directives/seed/seed.html'
    });
})();
