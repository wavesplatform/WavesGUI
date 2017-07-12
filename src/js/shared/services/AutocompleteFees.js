(function () {
    'use strict';

    angular
        .module(`app.shared`)
        .factory(`autocomplete.fees`, function AutocompleteFees() {
            const result = {
                fees: [
                    {
                        amount: 0.001,
                        displayText: `0.001 WAVE (Economic)`
                    },
                    {
                        amount: 0.0015,
                        displayText: `0.0015 WAVE (Standard)`
                    },
                    {
                        amount: 0.002,
                        displayText: `0.002 WAVE (Premium)`
                    }
                ],
                selectedFee: undefined,
                searchText: undefined
            };

            result.getFeeAmount = function () {
                return result.selectedFee ?
                    result.selectedFee.amount :
                    result.searchText;
            };

            result.defaultFee = function (feeAmount) {
                let feeIndex = 0;

                if (angular.isNumber(feeAmount)) {
                    const index = _.findIndex(result.fees, (fee) => fee.amount === feeAmount);

                    if (index >= 0) {
                        feeIndex = index;
                    }
                }

                result.selectedFee = result.fees[feeIndex];
            };

            result.querySearch = function (searchText) {
                if (!searchText) {
                    return result.fees;
                }

                return _.filter(result.fees, (item) => item.amount.toString().indexOf(searchText) !== -1);
            };

            return result;
        })
        .factory(`autocomplete.assets`, function AutocompleteAssetsFactory() {
            function createAutocomplete() {
                const result = {
                    assets: [],
                    selectedAsset: undefined,
                    searchText: undefined
                };

                result.querySearch = function (searchText) {
                    if (!searchText) {
                        return result.assets.slice(0, 10);
                    }

                    const searchTextLC = searchText.toLowerCase();
                    const ids = {};
                    let list = [];

                    // Adding assets which match by name.
                    list = list.concat(result.assets.filter((asset) => {
                        ids[asset.id] = asset.displayName.toLowerCase().indexOf(searchTextLC) > -1;
                        return ids[asset.id];
                    }));

                    // Adding assets which match by ID.
                    list = list.concat(result.assets.filter((asset) => {
                        if (ids[asset.id] === true) {
                            return false;
                        } else {
                            ids[asset.id] = asset.id.indexOf(searchText) > -1;
                            return ids[asset.id];
                        }
                    }));

                    return list;
                };

                return result;
            }

            return {
                create() {
                    return createAutocomplete();
                }
            };
        });
})();
