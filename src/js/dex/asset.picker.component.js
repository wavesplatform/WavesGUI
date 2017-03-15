(function () {
    'use strict';

    function AssetPickerController($attrs) {
        var ctrl = this;

        ctrl.name = $attrs.name;
        ctrl.assets = $attrs.assets;

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
