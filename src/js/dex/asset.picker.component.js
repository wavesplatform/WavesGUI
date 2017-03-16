(function () {
    'use strict';

    function AssetPickerController() {
        var ctrl = this;

        ctrl.pressed = false;

        ctrl.press = function () {
            ctrl.pressed = !ctrl.pressed;
        };
    }

    angular
        .module('app.dex')
        .component('wavesDexAssetPicker', {
            controller: AssetPickerController,
            bindings: {
                name: '@',
                assets: '<'
            },
            templateUrl: 'dex/asset.picker.component'
        });
})();
