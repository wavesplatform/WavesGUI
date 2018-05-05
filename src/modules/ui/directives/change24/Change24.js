(function () {
    'use strict';

    /**
     * @param Base
     * @param {object} $attrs
     * @param {IPollCreate} createPoll
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
                /**
                 * @type {boolean}
                 */
                this.directionByPair = null;
            }

            $postLink() {
                this.precision = Number(this.precision) || 2;
                this.interval = Number(this.interval) || 5000;

                let handler = null;
                if ($attrs.noUpdate) {

                    const apply = () => {
                        const onFulfilled = this._setChange.bind(this);
                        this._getChange().then(onFulfilled, onFulfilled);
                    };

                    apply();
                    handler = apply;
                } else {
                    const poll = createPoll(this, this._getChange, this._setChange, this.interval);
                    handler = () => {
                        poll.restart();
                    };
                }

                this.observe(['assetFrom', 'assetTo'], handler);
            }

            /**
             * @return {Promise}
             * @private
             */
            _getChange() {
                if (this.assetFrom && this.assetTo) {
                    if (this.directionByPair) {
                        return Waves.AssetPair.get(this.assetFrom, this.assetTo).then((pair) => {
                            return waves.utils.getChange(pair.amountAsset.id, pair.priceAsset.id);
                        });
                    }
                    return waves.utils.getChange(this.assetFrom, this.assetTo);
                } else {
                    return Promise.resolve(null);
                }
            }

            /**
             * @param data
             * @private
             */
            _setChange(data) {
                if (typeof data === 'number') {
                    $element.toggleClass('green', data > 0);
                    $element.toggleClass('red', data < 0);
                    $element.html(data.toFixed(this.precision));
                } else {
                    $element.html('—');
                }
            }

        }

        return new Change24();
    };

    controller.$inject = ['Base', '$attrs', 'createPoll', '$element', 'waves', 'i18n'];

    angular.module('app.ui').component('wChange24', {
        bindings: {
            assetFrom: '<',
            assetTo: '<',
            directionByPair: '<',
            precision: '@',
            noUpdate: '@',
            interval: '@',
            ns: '@'
        },
        transclude: false,
        controller
    });
})();
