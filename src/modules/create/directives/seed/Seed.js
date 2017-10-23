(function () {
    'use strict';

    const AVAILABLE_TYPES = [
        'read',
        'random',
        'write'
    ];

    const ANIMATION_TIME = 150;

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
                if (!AVAILABLE_TYPES.includes(this.type)) {
                    throw new Error('Wrong type!');
                }
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
                        this._mixSeed();
                        controller.listen(this.seed, 'revert', (revertIndex) => {
                            this._revert(revertIndex);
                        });
                        break;
                    case 'write':
                        this.parts = this.hiddenParts.map(() => '');
                        controller.listen(this.seed, 'show', (showIndex) => {
                            this._show(showIndex);
                        });
                        window.fill = () => {
                            this.parts = this.hiddenParts.slice();
                            this._validate();
                        };
                        break;
                    default:
                        this.parts = this.seed.split(' ');
                }
            }

            $onChanges(changes) {
                if (changes.seed) {
                    controller.stopListen(changes.seed.previousValue);
                    this._initialize();
                }
            }

            $onDestroy() {
                controller.stopListen(this.seed);
            }

            /**
             * @param event
             * @param index
             * @private
             */
            _onClick(event, index) {
                switch (this.type) {
                    case 'write':
                        this._removePart(event, index);
                        break;
                    case 'random':
                        this._addNewPart(event, index);
                        break;
                }
            }

            _getInsertIndex() {
                let i;
                this.parts.some((word, index) => {
                    if (!word.trim()) {
                        i = index;
                        return true;
                    }
                    return false;
                });
                return i;
            }

            /**
             * @param index
             * @private
             */
            _show(index) {
                const word = this.hiddenParts[index];
                this.parts = this.parts.slice();
                const active = this._getInsertIndex();
                this.parts[active] = word;
                $scope.$$postDigest(() => {
                    Seed.animateIn($element.find('.seed-item').eq(active)).then(() => {
                        if (this.parts.filter((item) => !!item.trim()).length === this.hiddenParts.length) {
                            this._validate();
                        }
                    });
                });
            }

            /**
             * @param e
             * @param index
             * @private
             */
            _removePart(e, index) {
                const $target = $(e.target);
                Seed.animateOut($target).then(() => {
                    controller.trigger(this.seed, 'revert', this.hiddenParts.indexOf(this.parts[index]));
                    this.parts[index] = '';
                    $scope.$$postDigest(() => {
                        Seed.dropStyle($target);
                    });
                });
            }

            /**
             * @param index
             * @private
             */
            _revert(index) {
                const movedIndex = this.parts.indexOf(this.hiddenParts[index]);
                const $target = $element.find('.seed-item').eq(movedIndex);
                const $clone = Seed.createClone($target);
                Seed.animateIn($clone).then(() => {
                    $target.removeClass('moved');
                    $clone.remove();
                });
            }

            /**
             * @param e
             * @param index
             * @returns {null}
             * @private
             */
            _addNewPart(e, index) {
                const $target = $(e.target);
                if ($target.hasClass('moved')) {
                    return null;
                }
                const $clone = Seed.createClone($target);
                const part = this.parts[index];
                const realIndex = this.hiddenParts.indexOf(part);

                Seed.animateOut($clone).then(() => {
                    $clone.remove();
                    controller.trigger(this.seed, 'show', realIndex);
                });
            }

            /**
             * @private
             */
            _mixSeed() {
                for (let i = 0; i < 100; i++) {
                    this.parts.sort(() => {
                        const num = Math.random();
                        return num < 0.33 ? -1 : num > 0.66 ? 1 : 0;
                    });
                }
            }

            /**
             * @private
             */
            _validate() {
                if (this.parts.join(' ') !== this.seed) {
                    this.parts.forEach((part) => {
                        const origin = this.hiddenParts.indexOf(part);
                        controller.trigger(this.seed, 'revert', origin);
                    });
                    this.parts = this.hiddenParts.map(() => '');
                } else {
                    this.onSuccess();
                }
            }

            static animate($element, properties, options) {
                return $q((resolve) => {
                    options = options || {
                        duration: ANIMATION_TIME
                    };
                    if (options.complete) {
                        const origin = options.complete;
                        options.complete = function () {
                            resolve();
                            origin();
                        };
                    } else {
                        options.complete = resolve;
                    }
                    $element.stop(true, true).animate(properties, options);
                });
            }

            static dropStyle($element) {
                $element.css({
                    opacity: '1',
                    transform: 'scale(1)'
                });
            }

            /**
             * @param {jQuery} $element
             * @returns {jQuery}
             */
            static createClone($element) {

                const $clone = $element.clone()
                    .removeClass('write')
                    .removeClass('full')
                    .removeClass('moved')
                    .addClass('read');

                const offset = $element.offset();

                document.body.appendChild($clone.get(0));
                $clone.addClass('clone');
                $clone.css({
                    position: 'absolute',
                    left: offset.left,
                    top: offset.top,
                    margin: '0'
                });

                $element.addClass('moved');

                return $clone;
            }

            static animateOut($element) {
                return Seed.animate($element, { opacity: 0 }, {
                    progress: (tween, progress) => {
                        $element.css('transform', `scale(${1 - progress})`);
                    }
                });
            }

            static animateIn($element) {
                $element.css('opacity', 0);
                return Seed.animate($element, { opacity: 1 }, {
                    progress: (tween, progress) => {
                        $element.css('transform', `scale(${progress})`);
                    }
                });
            }

        }


        return new Seed();

    };


    controller.events = Object.create(null);

    controller.listen = function (seed, event, listener) {
        if (!controller.events[seed]) {
            controller.events[seed] = Object.create(null);
        }
        if (!controller.events[seed][event]) {
            controller.events[seed][event] = [];
        }
        controller.events[seed][event].push(listener);
    };

    controller.stopListen = function (seed) {
        if (controller.events[seed]) {
            delete controller.events[seed];
        }
    };

    controller.trigger = function (seed, event, data) {
        if (controller.events[seed] && controller.events[seed][event]) {
            controller.events[seed][event].slice().forEach((cb) => cb(data));
        }
    };

    controller.$inject = ['$element', '$scope', '$q'];

    angular.module('app.create').component('wSeed', {
        bindings: {
            type: '@',
            seed: '@',
            onSuccess: '&'
        },
        controller: controller,
        templateUrl: '/modules/create/directives/seed/seed.html'
    });
})();
