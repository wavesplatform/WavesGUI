(function () {
    'use strict';

    /**
     * @param Base
     * @param {IPollCreate} createPoll
     * @param {User} user
     * @param {Waves} waves
     * @param {app.utils} utils
     * @param {JQuery} $element
     * @param {$rootScope.Scope} $scope
     * @return {Exchange}
     */
    const controller = function (Base, createPoll, user, waves, utils, $element, $scope) {

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
                 * @type {Asset}
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
                this.poll = null;
            }

            $postLink() {
                this.interval = Number(this.interval) || 5000;
                this.noUpdate = this.noUpdate == null;

                waves.node.assets.getExtendedAsset(this.targetAssetId || user.getSetting('baseAssetId'))
                    .then((mirror) => {
                        this.mirror = mirror;

                        if (this.noUpdate) {
                            this._getMirrorBalance()
                                .then((balance) => {
                                    this.mirrorBalance = balance;
                                    $scope.$digest();
                                });
                        } else {
                            this.poll =
                                createPoll(this, this._getMirrorBalance, 'mirrorBalance', this.interval, { $scope });
                        }

                        this.observe('balance', this._onChangeBalance);
                        this.observe('mirrorBalance', this._onChangeMirrorBalance);

                        this._onChangeBalance();
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
                        this.poll.restart();
                    }
                }
            }

            /**
             * @return {Promise}
             * @private
             */
            _getMirrorBalance() {
                if (!this.balance) {
                    return Promise.resolve(null);
                }
                return waves.utils.getRateApi(this.balance.asset.id, this.mirror.id)
                    .then((api) => {
                        return this.balance && api.exchange(this.balance.getTokens()) || 0;
                    });
            }

            _onChangeMirrorBalance() {
                $element.html(this.mirrorBalance ? this.mirrorBalance.toFormat() : '');
                // TODO Investigate. Author Tsigel at 29/11/2017 17:24
            }

        }

        return new Exchange();
    };

    controller.$inject = ['Base', 'createPoll', 'user', 'waves', 'utils', '$element', '$scope'];

    angular.module('app.ui').component('wExchange', {
        bindings: {
            balance: '<',
            interval: '@',
            rateDate: '@',
            noUpdate: '@',
            targetAssetId: '@'
        },
        transclude: false,
        controller
    });
})();
