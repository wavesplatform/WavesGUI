(function () {
    'use strict';

    /**
     * @param Base
     * @param createPoll
     * @param {User} user
     * @param {Waves} waves
     * @param {app.utils} utils
     * @return {Exchange}
     */
    const controller = function (Base, createPoll, user, waves, utils) {

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
                /**
                 * @type {string}
                 */
                this.targetAssetId = null;
                this.noUpdate = null;
                this.rateDate = null; // TODO Add support for rate date. Author Tsigel at 14/11/2017 08:19
                /**
                 * @type {Poll}
                 */
                this._pollLeasing = null;
            }

            $postLink() {
                this.interval = Number(this.interval) || 5000;

                waves.node.assets.info(this.targetAssetId || user.getSetting('baseAssetId'))
                    .then((mirror) => {
                        this.mirror = mirror;

                        if (this.noUpdate) {
                            this._getMirrorBalance()
                                .then((balance) => {
                                    this.mirrorBalance = balance;
                                });
                        } else {
                            this._pollLeasing = createPoll(this, this._getMirrorBalance, 'mirrorBalance', this.interval);
                        }

                        this.observe('balance', this._onChangeBalance);
                    });
            }

            /**
             * @private
             */
            _onChangeBalance() {
                if (this.balance) {
                    if (this.noUpdate) {
                        this._getMirrorBalance()
                            .then((balance) => {
                                this.mirrorBalance = balance;
                            });
                    } else {
                        this._pollLeasing.restart();
                    }
                }
            }

            /**
             * @return {Promise}
             * @private
             */
            _getMirrorBalance() {
                if (!this.balance) {
                    return utils.when(null);
                }
                return waves.utils.getRateApi(this.balance.asset.id, this.mirror.id)
                    .then((api) => {
                        return this.balance && api.exchange(this.balance.getTokens()) || 0;
                    });
            }

        }

        return new Exchange();
    };

    controller.$inject = ['Base', 'createPoll', 'user', 'waves', 'utils'];

    angular.module('app.ui').component('wExchange', {
        bindings: {
            balance: '<',
            interval: '@',
            rateDate: '@',
            noUpdate: '@',
            targetAssetId: '@'
        },
        template: '<span w-nice-number="$ctrl.mirrorBalance" precision="$ctrl.mirror.precision"></span>',
        transclude: false,
        controller
    });
})();
