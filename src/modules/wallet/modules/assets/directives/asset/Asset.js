(function () {
    'use strict';

    /**
     * @return {Asset}
     */
    const controller = function (Base, utils, createPoll, $scope) {

        class Asset extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {IBalanceDetails}
                 */
                this.balance = null;
                /**
                 * @type {number}
                 */
                this.rating = null;
                /**
                 * @type {boolean}
                 */
                this.ratingError = false;
            }

            $postLink() {
                const { isVerified, isGateway, isTokenomica } = utils.getDataFromOracles(this.balance.asset.id);
                this.isVerified = isVerified;
                this.isGateway = isGateway;
                this.isTokenomica = isTokenomica;
                createPoll(this, this._getTokenRating, this._setTokenRating, 60 * 1000);
            }

            isUnpinned() {
                return !WavesApp.ALWAYS_PINNED_ASSETS.includes(this.balance.asset.id);
            }

            _getTokenRating() {
                return ds.api.rating.getAssetsRating(this.balance.asset.id);
            }

            _setTokenRating(asset) {
                if (!asset) {
                    return null;
                }
                if (!Array.isArray(asset)) {
                    this.ratingError = true;
                    return null;
                }
                this.rating = asset.rating;
                $scope.$apply();
            }

        }

        return new Asset();
    };

    controller.$inject = ['Base', 'utils', 'createPoll', '$scope'];

    angular.module('app.wallet.assets').component('wAsset', {
        bindings: {
            balance: '<',
            onClick: '&',
            onUnpinClick: '&'
        },
        templateUrl: 'modules/wallet/modules/assets/directives/asset/asset.html',
        controller
    });
})();
