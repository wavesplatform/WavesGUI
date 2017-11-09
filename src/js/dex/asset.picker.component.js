(function () {
    'use strict';

    var ASSET_ID_BYTE_LENGTH = 32;

    function AssetPickerController($scope, $element, autocomplete, apiService, utilityService) {
        var ctrl = this,
            autocompleteElement = $element.find('md-autocomplete');

        ctrl.isAssetLoading = false;
        ctrl.isPickingInProgress = false;
        ctrl.autocomplete = autocomplete.create();

        ctrl.$onChanges = function () {
            if (ctrl.assets && ctrl.pickedAsset) {
                if (!ctrl.isPickingInProgress) {
                    ctrl.autocomplete.selectedAsset = ctrl.pickedAsset;
                }

                ctrl.autocomplete.assets = ctrl.assets.map(function (asset) {
                    return asset.currency;
                }).filter(function (asset) {
                    return asset.verified && (asset !== ctrl.hiddenAsset);
                });
            }
        };

        autocompleteElement.on('focusin', function () {
            ctrl.isPickingInProgress = true;
        });

        autocompleteElement.on('focusout', function () {
            ctrl.isPickingInProgress = false;
            ctrl.autocomplete.selectedAsset = ctrl.pickedAsset;
        });

        ctrl.changeAsset = function () {
            var asset = ctrl.autocomplete.selectedAsset;
            if (asset && asset !== ctrl.pickedAsset) {
                ctrl.isPickingInProgress = false;
                $scope.$emit('asset-picked', asset, ctrl.type);
            }
        };

        ctrl.findAssets = function (query) {
            var assets = ctrl.autocomplete.querySearch(query);
            if (assets.length === 0 && isValidAssetId(query)) {
                ctrl.isAssetLoading = true;
                apiService.transactions.info(query).then(function (response) {
                    var currency = Currency.create({
                        id: response.id,
                        displayName: response.name,
                        precision: response.decimals
                    });

                    ctrl.autocomplete.assets.push(currency);
                    ctrl.autocomplete.selectedAsset = currency;

                    // That strangely unfocuses the element thus avoiding an empty dropdown.
                    autocompleteElement.focus();
                }).finally(function () {
                    ctrl.isAssetLoading = false;
                });
                return [];
            } else {
                ctrl.isAssetLoading = false;
                return assets;
            }
        };

        function isValidAssetId(str) {
            if (utilityService.isValidBase58String(str)) {
                return utilityService.base58StringToByteArray(str).length === ASSET_ID_BYTE_LENGTH;
            }
        }
    }

    AssetPickerController.$inject = ['$scope', '$element', 'autocomplete.assets', 'apiService', 'utilityService'];

    angular
        .module('app.dex')
        .component('wavesDexAssetPicker', {
            controller: AssetPickerController,
            bindings: {
                name: '@',
                type: '@',
                assets: '<',
                hiddenAsset: '<',
                pickedAsset: '<'
            },
            templateUrl: 'dex/asset.picker.component'
        });
})();
