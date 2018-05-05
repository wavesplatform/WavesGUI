(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @param {IPollCreate} createPoll
     * @param {$rootScope.Scope} $scope
     * @return {ChangeRate}
     */
    const controller = function (Base, waves, user, createPoll, $scope) {

        class ChangeRate extends Base {

            constructor() {
                super();
                /**
                 * @type {BigNumber}
                 */
                this.rate = null;
                /**
                 * @type {string}
                 */
                this.assetId = null;
                /**
                 * @type {Asset}
                 */
                this.mirror = null;
                /**
                 * @type {number} // TODO Add rate for date support. Author Tsigel at 14/11/2017 11:26
                 */
                this.date = null;
                /**
                 * @type {Poll}
                 */
                this.poll = null;

                this.observe('assetId', this._onChangeAssetId);
            }

            $postLink() {
                this.interval = Number(this.interval) || 5000;

                waves.node.assets.getExtendedAsset(user.getSetting('baseAssetId'))
                    .then((mirror) => {
                        this.mirror = mirror;

                        if (!this.noUpdate) {
                            this.poll = createPoll(this, this._getRate, 'rate', this.interval, { $scope });
                        } else {
                            this._onChangeAssetId();
                        }
                    });
            }

            /**
             * @private
             */
            _onChangeAssetId() {
                if (this.assetId) {
                    if (this.poll) {
                        this.poll.restart();
                    } else {
                        this._getRate().then((rate) => {
                            this.rate = rate;
                            $scope.$digest();
                        });
                    }
                }
            }

            _getRate() {
                return this.assetId && this.mirror && waves.utils.getRate(this.assetId, this.mirror.id)
                    .then((rate) => rate) || Promise.resolve(new BigNumber(0));
            }

        }

        return new ChangeRate();
    };

    controller.$inject = ['Base', 'waves', 'user', 'createPoll', '$scope'];

    angular.module('app.ui').component('wChangeRate', {
        bindings: {
            assetId: '<',
            noUpdate: '@',
            interval: '@',
            date: '@'
        },
        template: '<span w-nice-number="$ctrl.rate" precision="$ctrl.mirror.precision"></span>',
        transclude: false,
        controller
    });
})();
