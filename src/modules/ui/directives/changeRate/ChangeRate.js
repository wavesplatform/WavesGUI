(function () {
    'use strict';

    /**
     * @param Base
     * @param {AssetsService} assetsService
     * @param {User} user
     * @param createPromise
     * @param createPoll
     * @return {ChangeRate}
     */
    const controller = function (Base, assetsService, user, createPromise, createPoll) {

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
                 * @type {IAssetInfo}
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

                createPromise(this, user.getSetting('baseAssetId'))
                    .then(assetsService.getAssetInfo)
                    .then((mirror) => {
                        this.mirror = mirror;

                        if (!this.noUpdate) {
                            this.poll = createPoll(this, this._getRate, 'rate', this.interval);
                        } else {
                            this._onChangeAssetId();
                        }
                    });
            }

            _onChangeAssetId() {
                if (this.assetId) {
                    if (this.poll) {
                        this.poll.restart();
                    } else {
                        this._getRate().then((rate) => {
                            this.rate = rate;
                        });
                    }
                }
            }

            _getRate() {
                return this.assetId && this.mirror && assetsService.getRate(this.assetId, this.mirror.id)
                    .then((api) => api.rate) || Promise.resolve(null);
            }

        }

        return new ChangeRate();
    };

    controller.$inject = ['Base', 'assetsService', 'user', 'createPromise', 'createPoll'];

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
