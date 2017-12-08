(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {app.utils} utils
     * @param {Waves} waves
     * @param {ModalManager} modalManager
     * @param createPoll
     * @return {LeasingCtrl}
     */
    const controller = function (Base, $scope, utils, waves, modalManager, createPoll) {

        class LeasingCtrl extends Base {

            constructor() {
                super($scope);

                this.chartOptions = {
                    items: {
                        available: {
                            color: '#66bf00',
                            radius: 80
                        },
                        leased: {
                            color: '#ffebc0',
                            radius: 64
                        },
                        leasedIn: {
                            color: '#bacaf5',
                            radius: 75
                        }
                    },
                    center: 34,
                    direction: true,
                    startFrom: Math.PI / 2
                };
                createPoll(this, waves.node.get, this._setLeasingData, 1000);
            }

            startLeasing() {
                return modalManager.showStartLeasing();
            }

            /**
             * @param {BigNumber} available
             * @param {BigNumber} leasedIn
             * @param {BigNumber} leased
             * @private
             */
            _setLeasingData({ leasedOut, leasedIn, available }) {
                this.available = available;
                this.leased = leasedOut;
                this.leasedIn = leasedIn;
                this.total = available.add(leasedOut);

                this.chartData = [
                    { id: 'available', value: available },
                    { id: 'leased', value: leasedOut },
                    { id: 'leasedIn', value: leasedIn }
                ];
            }

        }

        return new LeasingCtrl();
    };

    controller.$inject = ['Base', '$scope', 'utils', 'waves', 'modalManager', 'createPoll'];

    angular.module('app.wallet.leasing').controller('LeasingCtrl', controller);
})();
