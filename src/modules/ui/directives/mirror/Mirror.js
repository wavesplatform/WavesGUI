(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @param {app.utils} utils
     * @param {function} createPoll
     */
    const controller = function (Base, waves, user, utils, createPoll) {

        class Mirror extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.assetId = null;
                /**
                 * @type {number|string}
                 */
                this.interval = null;
                this.noUpdate = null;
                /**
                 * @type {IAssetInfo}
                 */
                this.mirror = null;
                this.balance = null;
            }

            $postLink() {
                if (!this.assetId) {
                    throw new Error('Has no asset id');
                }

                this.interval = Number(this.interval) || 5000;

                waves.node.assets.info(user.getSetting('baseAssetId'))
                    .then((mirror) => {
                        this.mirror = mirror;

                        if (this.noUpdate) {
                            this._getBalance()
                                .then((balance) => {
                                    this.balance = balance;
                                });
                        } else {
                            createPoll(this, this._getBalance, 'balance', this.interval);
                        }

                    });
            }

            _getBalance() {
                return utils.whenAll([
                    waves.node.assets.balance(this.assetId),
                    waves.utils.getRateApi(this.assetId, this.mirror.id)
                ])
                    .then(([assetBalance, api]) => {
                        return api.exchange(assetBalance.balance.getTokens());
                    });
            }

        }

        return new Mirror();
    };

    controller.$inject = ['Base', 'waves', 'user', 'utils', 'createPoll', '$scope'];

    angular.module('app.ui')
        .component('wMirror', {
            bindings: {
                assetId: '@',
                noUpdate: '@',
                interval: '@'
            },
            template: '<span w-nice-number="$ctrl.balance" precision="$ctrl.mirror.precision"></span>',
            controller
        });
})();
