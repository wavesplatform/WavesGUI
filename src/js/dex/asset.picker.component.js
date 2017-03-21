(function () {
    'use strict';

    function AssetPickerController() {
        var ctrl = this;

        setupValues();
        ctrl.$onChanges = setupValues;

        ctrl.press = function () {
            ctrl.pressed = !ctrl.pressed;
        };

        ctrl.onSubmit = function () {
            ctrl.submit();
        };

        function setupValues() {
            if (ctrl.chosenAsset) {
                ctrl.queryString = ctrl.chosenAsset.displayName;
                ctrl.pressed = false;
            }
        }
    }

    angular
        .module('app.dex')
        .component('wavesDexAssetPicker', {
            controller: AssetPickerController,
            bindings: {
                name: '@',
                assets: '<',
                chosenAsset: '<',
                submit: '&'
            },
            templateUrl: 'dex/asset.picker.component'
        });
})();
