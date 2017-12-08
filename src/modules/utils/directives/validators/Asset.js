(function () {
    'use strict';

    /**
     * @param {typeof Num} Num
     * @param {app.utils} utils
     * @param {Waves} waves
     * @return {Asset}
     */
    const factory = function (Num, utils, waves) {

        class Asset extends Num {

            constructor(params) {
                super(params);

                /**
                 * @type {string}
                 */
                this.assetId = this.$attrs.assetId;
                if (!this.assetId) {
                    throw new Error('Has no asset id attribute for asset validator');
                }

                this.onReady()
                    .then((asset) => {
                        /**
                         * @type {IAsset}
                         */
                        this.asset = asset;

                        this.registerValidator('asset-input', (modelValue, viewValue) => {
                            const parts = String(viewValue || 0)
                                .replace(',', '')
                                .split('.');
                            if (!modelValue) {
                                return 'required' in this.$attrs;
                            }
                            return (!parts[1] || parts[1].length <= asset.precision);
                        });

                        if (this.$attrs.maxBalance) {
                            let balance;

                            this.registerValidator('asset-max', (modelValue) => {
                                if (!balance) {
                                    return true;
                                } else {
                                    return modelValue && modelValue.lte(balance.getTokens());
                                }
                            });

                            this.$scope.$watch(this.$attrs.maxBalance, (value) => {
                                balance = value;
                                this.validateByName('asset-max');
                            });
                        }
                    });
            }

            getFormatter() {
                // TODO refactor
                return (value) => {
                    if (new BigNumber(value).eq(utils.parseNiceNumber(this.$input.val()))) {
                        return this.$input.val();
                    } else {
                        return value;
                    }
                };
            }

            onReady() {
                return super.onReady()
                    .then(() => waves.node.assets.info(this.assetId));
            }

        }

        return Asset;
    };

    factory.$inject = ['Num', 'utils', 'waves'];

    angular.module('app.utils')
        .factory('Asset', factory);
})();
