(function () {
    'use strict';

    const AVAILABLE_TYPES = [
        'read',
        'random',
        'write'
    ];

    const controller = function ($element, $scope) {

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

                this.initialize();
            }

            initialize() {
                this.hiddenParts = this.seed.split(' ');
                switch (this.type) {
                    case 'random':
                        this.parts = this.seed.split(' ');
                        this.initializeRandom();
                        break;
                    case 'write':
                        this.initializeWrite();
                        break;
                    default:
                        this.parts = this.seed.split(' ');
                }
            }

            initializeRandom() {
                this.mixSeed();
                this.setRandomHandlers();
            }

            setRandomHandlers() {

                $element.find('.seed-container').on('mousedown', '.seed-item', (e) => {
                    const elements = $element.find('.seed-container')
                        .children()
                        .toArray();

                    const $target = $(e.target);
                    const index = elements.indexOf($target.get(0));
                    const $clone = $target.clone();

                    controller.dragData.active = this.hiddenParts.indexOf(this.parts[index]);

                    document.body.appendChild($clone.get(0));

                    $clone.css({ position: 'absolute', margin: '0' })
                        .offset($target.offset())
                        .animate({
                            top: e.pageY + 5,
                            left: e.pageX + 5
                        }, {
                            progress: function (promise, progress) {
                                const scale = 1 - 0.4 * progress;
                                $clone.css('transform', `scale(${scale}, ${scale})`);
                            },
                            duration: 300
                        });

                    const blur = function () {
                        document.removeEventListener('mousemove', move, false);
                        document.removeEventListener('mouseup', up, false);
                        window.removeEventListener('blur', blur, false);
                        $clone.remove();
                        controller.dragData.active = null;
                    };

                    const move = function (e) {
                        e.preventDefault();
                        $clone.stop(true, true).css({
                            top: e.pageY + 5,
                            left: e.pageX + 5
                        });
                    };

                    const up = function () {
                        document.removeEventListener('mousemove', move, false);
                        document.removeEventListener('mouseup', up, false);
                        window.removeEventListener('blur', blur, false);
                        $clone.remove();
                        controller.dragData.active = null;
                    };

                    window.addEventListener('blur', blur, false);
                    document.addEventListener('mousemove', move, false);
                    document.addEventListener('mouseup', up, false);
                });
            }

            mixSeed() {
                for (let i = 0; i < 10; i++) {
                    this.parts.sort(() => {
                        const num = Math.random();
                        return num < 0.33 ? -1 : num > 0.66 ? 1 : 0;
                    });
                }
            }

            initializeWrite() {
                this.parts = this.hiddenParts.map(() => ' ');
                this.setWriteHandlers();
            }

            setWriteHandlers() {
                $element.find('.seed-container').on('mouseup', '.seed-item', (e) => {
                    const elements = $element.find('.seed-container')
                        .children()
                        .toArray();

                    if (controller.dragData.active != null) {
                        const index = elements.indexOf(e.target);
                        this.parts[index] = this.hiddenParts[controller.dragData.active];
                        if (this.parts.every((text) => Boolean(text.trim()))) {
                            this.validate();
                        }
                        $scope.$apply();
                    }
                });
            }

            getClass(index) {
                if (this.type === 'write') {
                    return this.parts[index].trim() ? 'full' : 'empty';
                } else {
                    return '';
                }
            }

            validate() {
                if (this.parts.join(' ') !== this.seed) {
                    alert('Wrong seed!'); // TODO ...
                }
            }
        }

        return new Seed();

    };

    controller.dragData = {
        active: null
    };

    controller.$inject = ['$element', '$scope'];

    angular.module('app.welcome.getStarted').component('wSeed', {
        bindings: {
            type: '@',
            seed: '@'
        },
        controller: controller,
        templateUrl: 'modules/welcome/modules/getStarted/directives/seed/seed.html'
    });
})();
