(function () {
    'use strict';

    function AssetPickerController($scope, autocomplete) {
        var ctrl = this;

        ctrl.autocomplete = autocomplete.create();

        ctrl.$onChanges = function () {
            if (ctrl.assets && ctrl.pickedAsset) {
                ctrl.autocomplete.selectedAsset = ctrl.pickedAsset;
                ctrl.autocomplete.assets = ctrl.assets.map(function (asset) {
                    return asset.currency;
                }).filter(function (asset) {
                    return asset !== ctrl.hiddenAsset;
                });
            }
        };

        ctrl.changeAsset = function () {
            var asset = ctrl.autocomplete.selectedAsset;
            if (asset && asset !== ctrl.pickedAsset) {
                $scope.$emit('asset-picked', asset, ctrl.type);
            }
        };
    }

    AssetPickerController.$inject = ['$scope', 'autocomplete.assets'];

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
