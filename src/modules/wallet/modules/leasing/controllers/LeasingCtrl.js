(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {app.utils} utils
     * @param createPoll
     * @return {LeasingCtrl}
     */
    const controller = function (Base, $scope, utils, createPoll) {

        class LeasingCtrl extends Base {

            constructor() {
                super($scope);

                this.chartOptions = {
                    items: {
                        available: {
                            color: '#66bf00',
                            radius: 77
                        },
                        leased: {
                            color: '#ffebc0',
                            radius: 64
                        },
                    },
                    center: 34,
                    direction: true,
                    startFrom: 3 * Math.PI / 2
                };
                createPoll(this, this._getLeasingData, this._setLeasingData, 1000);
            }

            _getLeasingData() {
                return utils.whenAll([
                    Waves.Money.fromTokens('2305.00633568', WavesApp.defaultAssets.WAVES),
                    Waves.Money.fromTokens('10000', WavesApp.defaultAssets.WAVES)
                ]);
            }

            _setLeasingData([available, leased]) {
                this.available = available;
                this.leased = leased;

                this.chartData = {
                    available,
                    leased
                };
            }

        }

        return new LeasingCtrl();
    };

    controller.$inject = ['Base', '$scope', 'utils', 'createPoll'];

    angular.module('app.wallet.leasing').controller('LeasingCtrl', controller);
})();
