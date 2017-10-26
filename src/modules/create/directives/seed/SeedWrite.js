(function () {
    'use strict';

    /**
     * @param SeedBase
     * @param $element
     * @param {ISeedService} seedService
     * @return {SeedWrite}
     */
    const controller = function (SeedBase, $element, seedService) {

        class SeedWrite extends SeedBase {

            constructor() {
                super($element);
                /**
                 * @type {JQuery}
                 * @private
                 */
                this._$container = null;
                /**
                 * @type {ISeedWriteChild[]}
                 * @private
                 */
                this._children = [];
                /**
                 * @type {number}
                 * @private
                 */
                this._containerWidth = null;
            }

            $postLink() {
                super.$postLink();
                this._$container = $element.find('.seed-container');
                this._containerWidth = this._$container.width();
                this.receive(seedService.show, this._show, this);
            }

            /**
             * @param e
             * @param index
             * @private
             */
            _removePart(e, index) {
                const $target = $(e.target);
                const partIndex = this._$container.children()
                    .toArray()
                    .indexOf(e.target);

                this.parts[partIndex] = '';
                this.animateOut($target).then(() => {
                    seedService.revert.dispatch(index);
                    this._children = this._children.filter(tsUtils.notContains(this._getChildByElement($target)));
                    $target.remove();

                    this._resetPositions();
                });
            }

            _resetPositions() {
                let currentLine = SeedWrite._getPropertyGetter(this._$container, 'padding-top')();
                let currentWidth = 0;
                const lines = {};
                this._children.forEach((child) => {
                    if (currentWidth + child.width < this._containerWidth) {
                        currentWidth += child.width;
                    } else {
                        currentWidth = child.width;
                        currentLine += child.height;
                    }
                    if (!lines[currentLine]) {
                        lines[currentLine] = [];
                    }
                    lines[currentLine].push(child);
                });

                Object.keys(lines).forEach((lineName) => {
                    const line = lines[lineName];
                    const width = this._getLineWidth(line);
                    let left = (this._$container.outerWidth() - width) / 2;
                    line.forEach((child) => {
                        const itemLeft = left;
                        if (!child.line) {
                            child.$element.css({
                                left: itemLeft,
                                top: Number(lineName)
                            });
                            this.animateIn(child.$element);
                        } else if (child.line !== Number(lineName)) {
                            this.animateOut(child.$element).then(() => {
                                child.$element.css({ left: itemLeft, top: child.line });
                                this.animateIn(child.$element);
                            });
                        } else {
                            this.animate(child.$element, { left: left, top: child.line });
                        }
                        child.line = Number(lineName);
                        left += child.width;
                    });
                });

            }

            /**
             * @param index
             * @private
             */
            _show({ index, word }) {

                const $element = $(`<span class="seed-item hidden">${word}</span>`);
                this._$container.append($element);

                const child = this._createChild({ index, word, $element });
                this._children.push(child);
                $element.removeClass('hidden');
                this._resetPositions();

                $element.on('click', (e) => {
                    this._removePart(e, index);
                });

                // if (this.parts.filter(Boolean).length === this.hiddenParts.length) {
                //     this.isFull = true;
                //     this._validate();
                // } else {
                //     this.isFull = false;
                // }
            }

            /**
             * @param index
             * @param word
             * @param $element
             * @return {ISeedWriteChild}
             * @private
             */
            _createChild({ index, word, $element }) {
                const margin = SeedWrite._getPropertyGetter($element, 'margin-left')();

                const child = {
                    randomIndex: index,
                    word,
                    width: $element.outerWidth() + margin * 2,
                    height: $element.outerHeight() + margin * 2,
                    $element,
                    line: null
                };
                [
                    {
                        name: 'left',
                        get: SeedWrite._getPropertyGetter($element, 'left')
                    },
                    {
                        name: 'top',
                        get: SeedWrite._getPropertyGetter($element, 'top')
                    }
                ].forEach((item) => {
                    Object.defineProperty(child, item.name, { get: item.get });
                });
                return child;
            }

            clear() {
                this.parts.forEach((part) => {
                    const origin = this.hiddenParts.indexOf(part);
                    controller.trigger(this.seed, 'revert', origin);
                });
                this.parts = this.hiddenParts.map(() => '');
                this._$container.children().each((index, element) => {
                    const $element = $(element);
                    this.animateOut($element).then(() => {
                        $element.remove();
                    });
                });
            }

            /**
             * @param {ISeedWriteChild[]} line
             * @return {number}
             * @private
             */
            _getLineWidth(line) {
                return line.reduce((result, child) => {
                    return result + child.width;
                }, 0);
            }

            /**
             * @param {JQuery} $element
             * @return {ISeedWriteChild}
             * @private
             */
            _getChildByElement($element) {
                return tsUtils.find(this._children, (child) => child.$element.get(0) === $element.get(0));
            }

            /**
             * @param {JQuery} $element
             * @param {string} property
             * @return {Function}
             * @private
             */
            static _getPropertyGetter($element, property) {
                return function () {
                    return parseInt($element.css(property), 10);
                };
            }

        }

        return new SeedWrite();
    };

    controller.$inject = ['SeedBase', '$element', 'seedService'];

    angular.module('app.create').component('wSeedWrite', {
        bindings: {
            seed: '@'
        },
        template: '<div class="seed-container"></div>',
        transclude: false,
        controller
    });
})();

/**
 * @typedef {Object} ISeedWriteChild
 * @property {number} left
 * @property {number} width
 * @property {number} height
 * @property {number} top
 * @property {JQuery} $element
 * @property {string} word
 * @property {number} randomIndex
 * @property {string} line
 */
