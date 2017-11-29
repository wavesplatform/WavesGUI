(function () {
    'use strict';

    /**
     * @param Base
     * @param {object} $attrs
     * @param {function} createPoll
     * @param {JQuery} $element
     * @param {Waves} waves
     * @return {Change24}
     */
    const controller = function (Base, $attrs, createPoll, $element, waves) {

        class Change24 extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.assetFrom = null;
                /**
                 * @type {string}
                 */
                this.assetTo = null;
                /**
                 * @type {Number}
                 */
                this.precision = null;
                /**
                 * @type {number}
                 */
                this.interval = null;
            }

            $postLink() {
                this.precision = Number(this.precision) || 2;
                this.interval = Number(this.interval) || 5000;

                if ($attrs.noUpdate) {
                    this._getChange().then(this._setChange.bind(this), this._setChange.bind(this));
                    this.observe(['assetFrom', 'assetTo'], () => {
                        this._getChange().then(this._setChange.bind(this), this._setChange.bind(this));
                    });
                } else {
                    const poll = createPoll(this, this._getChange, this._setChange, this.interval);
                    this.observe(['assetFrom', 'assetTo'], () => {
                        poll.restart();
                    });
                }
            }

            _getChange() {
                if (this.assetFrom && this.assetTo) {
                    return waves.utils.getChange(this.assetFrom, this.assetTo);
                } else {
                    return null;
                }
            }

            _setChange(data) {
                if (typeof data === 'number') {
                    $element.html(data.toFixed(this.precision));
                } else {
                    $element.html('—');
                }
            }

        }

        return new Change24();
    };

    controller.$inject = ['Base', '$attrs', 'createPoll', '$element', 'waves'];

    angular.module('app.ui').component('wChange24', {
        bindings: {
            assetFrom: '<',
            assetTo: '<',
            precision: '@',
            noUpdate: '@',
            interval: '@'
        },
        transclude: false,
        controller
    });
})();
