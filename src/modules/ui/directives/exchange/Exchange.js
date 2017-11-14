(function () {
    'use strict';

    /**
     * @param Base
     * @param createPromise
     * @param createPoll
     * @param {User} user
     * @param {AssetsService} assetsService
     * @return {Exchange}
     */
    const controller = function (Base, createPromise, createPoll, user, assetsService) {

        class Exchange extends Base {

            constructor() {
                super();
                /**
                 * @type {Money}
                 */
                this.balance = null;
                /**
                 * @type {BigNumber}
                 */
                this.mirrorBalance = null;
                /**
                 * @type {number}
                 */
                this.interval = null;
                /**
                 * @type {IAssetInfo}
                 */
                this.mirror = null;
                this.noUpdate = null;
                this.rateDate = null; // TODO Add support for rate date. Author Tsigel at 14/11/2017 08:19
                /**
                 * @type {Poll}
                 */
                this.poll = null;

                this.observe('balance', this._onChangeBalance);
            }

            $postLink() {
                this.interval = Number(this.interval) || 5000;

                createPromise(this, user.getSetting('baseAssetId'))
                    .then(assetsService.getAssetInfo)
                    .then((mirror) => {
                        this.mirror = mirror;

                        if (this.noUpdate) {
                            this._getMirrorBalance()
                                .then((balance) => {
                                    this.mirrorBalance = balance;
                                });
                        } else {
                            this.poll = createPoll(this, this._getMirrorBalance, 'mirrorBalance', this.interval);
                        }

                        this.observe('balance', this._onChangeBalance);
                    });
            }

            _onChangeBalance() {
                if (this.balance) {
                    if (this.noUpdate) {
                        this._getMirrorBalance()
                            .then((balance) => {
                                this.mirrorBalance = balance;
                            });
                    } else {
                        this.poll.restart();
                    }
                }
            }

            _getMirrorBalance() {
                if (!this.balance) {
                    return null;
                }
                return assetsService.getRate(this.balance.asset.id, this.mirror.id)
                    .then((api) => {
                        return this.balance && api.exchange(this.balance.getTokens()) || 0;
                    });
            }

        }

        return new Exchange();
    };

    controller.$inject = ['Base', 'createPromise', 'createPoll', 'user', 'assetsService'];

    angular.module('app.ui').component('wExchange', {
        bindings: {
            balance: '<',
            interval: '@',
            rateDate: '@',
            noUpdate: '@'
        },
        template: '<span w-nice-number="$ctrl.mirrorBalance" precision="$ctrl.mirror.precision"></span>',
        transclude: false,
        controller
    });
})();
