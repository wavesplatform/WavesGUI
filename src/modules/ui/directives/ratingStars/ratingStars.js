(function () {
    'use strict';

    const controller = function (Base,
                                 user,
                                 $scope,
                                 RatingStarsFactory,
                                 $element,
                                 waves,
                                 modalManager,
                                 balanceWatcher) {

        const { SIGN_TYPE } = require('@waves/signature-adapter');
        const WCT_ID = 'DHgwrRvVyqJsepd32YbBqUeDH4GJ1N984X8QoekjgH8J';
        const WAVES_ID = 'WAVES';
        const NEED_WCT = 1;

        class RatingStars extends Base {

            /**
             * @type JQuery
             */
            $container;
            /**
             * @type boolean
             */
            hasBalance = false;
            /**
             * @type number
             */
            rating;
            /**
             * @type string
             */
            size;
            /**
             * @type boolean
             */
            canRate = false;

            $postLink() {
                const ratingStars = new RatingStarsFactory({
                    $container: $element.find('.rating-stars-wrapper'),
                    rating: this.rating,
                    size: this.size,
                    canRate: this.canRate,
                    hasBalance: this.hasBalance
                });

                this.observe('rating', () => {
                    ratingStars.update(this.rating);
                });

                if (this.canRate) {
                    this.observe('hasBalance', () => {
                        ratingStars.updateStatus(this.hasBalance);
                        $scope.$apply();
                    });

                    waves.node.getFee({ type: SIGN_TYPE.DATA })
                        .then(money => {
                            this.fee = money;
                            this._checkBalance();
                            this.receive(ratingStars.vote, this._onVote, this);
                        });
                }

            }

            _checkBalance() {
                const balance = balanceWatcher.getBalance();
                this.wavesBalance = balance[WAVES_ID];
                this.wctBalance = balance[WCT_ID];
                if (this.wavesBalance.gte(this.fee) && this.wctBalance.getTokens().gte(NEED_WCT)) {
                    this.hasBalance = true;
                    $scope.$apply();
                }
            }

            _onVote(rating) {
                waves.node.getFee({ type: SIGN_TYPE.DATA })
                    .then(money => {
                        this.fee = money;

                        const tx = waves.node.transactions.createTransaction({
                            type: SIGN_TYPE.DATA,
                            data: {
                                data: [
                                    {
                                        key: 'tokenRating',
                                        type: 'string',
                                        value: 'tokenRating'
                                    }, {
                                        key: 'assetId',
                                        type: 'string',
                                        value: this.assetId
                                    }, {
                                        key: 'score',
                                        type: 'integer',
                                        value: rating
                                    }
                                ],
                                fee: this.fee,
                                type: SIGN_TYPE.DATA
                            }
                        });
                        this.signable = ds.signature.getSignatureApi().makeSignable(tx);

                        this._generate(this.signable);
                    });

            }

            _generate(signable) {
                return modalManager.showConfirmTx(signable)
                    .then(() => this._reset());
            }

        }

        return new RatingStars();
    };

    controller.$inject = [
        'Base',
        'user',
        '$scope',
        'RatingStarsFactory',
        '$element',
        'waves',
        'modalManager',
        'balanceWatcher'];

    angular.module('app.ui').component('wRatingStars', {
        bindings: {
            rating: '<',
            size: '<',
            canRate: '<',
            assetId: '<'
        },
        // scope: false,
        templateUrl: 'modules/ui/directives/ratingStars/ratingStars.html',
        controller
    });

})();
