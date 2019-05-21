(function () {
    'use strict';

    const PATTERNS = {
        default: {
            en: 'DD/MM/YYYY',
            ru: 'DD.MM.YYYY'
        },
        short: {
            en: 'DD/MM',
            ru: 'DD.MM'
        }
    };

    const mul = {
        sec: 1000,
        min: 1000 * 60,
        hour: 1000 * 60 * 60,
        day: 1000 * 60 * 60 * 24,
        week: 1000 * 60 * 60 * 24 * 7,
        month: 1000 * 60 * 60 * 24 * 30,
        year: 1000 * 60 * 60 * 24 * 365
    };

    const AVAILABLE_MODES = [
        'default',
        'short',
        'time-ago'
    ];

    /**
     * @param {$rootScope.Scope} $scope
     * @param {JQuery} $element
     * @return {WDate}
     */
    const controller = function ($scope, $element) {

        class WDate {

            get date() {
                if ($scope.date instanceof Date) {
                    return $scope.date;
                } else if (typeof $scope.date === 'string') {
                    return new Date(Number($scope.date));
                } else {
                    return new Date($scope.date);
                }
            }

            constructor() {
                /**
                 * @type {string}
                 */
                this._date = null;
                /**
                 * @type {string}
                 */
                this.handlerType = null;
                /**
                 * @type {Function}
                 */
                this.timerCallback = null;
            }

            $postLink() {
                this.mode = $scope.mode || AVAILABLE_MODES[0];
                if (!AVAILABLE_MODES.includes(this.mode)) {
                    throw new Error('Wrong date mode!');
                }
                if (this.mode === 'time-ago') {
                    this.listener = () => this._initTimeAgoMode();
                    $scope.$watch('date', () => this._initTimeAgoMode());
                    this._initTimeAgoMode();
                } else {
                    this.filter = tsUtils.date(PATTERNS[this.mode][i18next.language]);
                    this.listener = () => {
                        this.filter = tsUtils.date(PATTERNS[this.mode][i18next.language]);
                        this._initSimpleMode();
                    };
                    $scope.$watch('date', () => this._initSimpleMode());
                    this._initSimpleMode();
                }
                i18next.on('languageChanged', this.listener);
            }

            _initTimeAgoMode() {
                if ($scope.date == null) {
                    return $element.html('');
                }

                if (this.handlerType && this.timerCallback) {
                    controller.off(this.handlerType, this.timerCallback);
                }

                const date = this.date;
                const delta = Date.now() - date;
                this.timerCallback = () => this._initTimeAgoMode();

                if (delta < mul.min) {
                    $element.html(`${Math.round(delta / mul.sec)} sec ago`);
                    this.handlerType = 'sec';
                    controller.once(this.handlerType, this.timerCallback);
                } else if (delta < mul.hour) {
                    $element.html(`${Math.round(delta / mul.min)} min ago`);
                    this.handlerType = 'min';
                    controller.once(this.handlerType, this.timerCallback);
                } else if (delta < mul.day) {
                    $element.html(`${Math.round(delta / mul.hour)} hours ago`);
                    this.handlerType = 'hour';
                    controller.once(this.handlerType, this.timerCallback);
                } else if (delta < mul.week) {
                    $element.html(`${Math.round(delta / mul.day)} days ago`);
                } else if (delta < mul.month) {
                    $element.html(`${Math.round(delta / mul.week)} weeks ago`);
                } else if (delta < mul.year) {
                    $element.html(`${Math.round(delta / mul.month)} months ago`);
                } else {
                    $element.html('A lot of time ago');
                }
            }

            _initSimpleMode() {

                if ($scope.date == null) {
                    return $element.html('');
                }

                $element.text(this.filter(this.date));
            }

            $onDestroy() {
                i18next.off('languageChanged', this.listener);
                if (this.handlerType && this.timerCallback) {
                    controller.off(this.handlerType, this.timerCallback);
                }
            }

        }

        return new WDate();
    };

    controller.$inject = ['$scope', '$element'];

    controller.handlers = {
        sec: [],
        min: [],
        hour: []
    };

    controller.timers = {
        sec: null,
        min: null,
        hour: null
    };

    controller.once = function (type, handler) {
        controller.handlers[type].push(handler);
        if (controller.isNeedStart(type)) {
            controller.startTimer(type);
        }
    };

    controller.off = function (type, handler) {
        controller.handlers[type] = controller.handlers[type].filter(tsUtils.notContains(handler));
    };

    controller.trigger = function (type) {
        const handlers = controller.handlers[type].slice();
        controller.handlers[type] = [];
        handlers.forEach((cb) => cb());
    };

    controller.isNeedStart = function (type) {
        return !!controller.handlers[type].length && !controller.timers[type];
    };

    controller.startTimer = function (type) {
        controller.timers[type] = setTimeout(() => {
            controller.timers[type] = null;
            controller.trigger(type);
        }, mul[type]);
    };

    angular.module('app')
        .directive('wDate', () => ({
            restrict: 'A',
            scope: {
                mode: '@',
                date: '<wDate'
            },
            controller: controller
        }));
})();
