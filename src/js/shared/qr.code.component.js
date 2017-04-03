(function () {
    'use strict';

    var BACKGROUND = '#fff',
        FOREGROUND = '#000',
        SIZE = 150;

    function QrCodeController($element) {

        var ctrl = this,
            canvas = $element.children('canvas'),
            qr = new QRious({
                element: canvas.get(0),
                size: ctrl.size || SIZE
            });

        ctrl.setCode = function () {
            ctrl.removeCode();
            if (ctrl.value) {
                qr.background = ctrl.background || BACKGROUND;
                qr.foreqround = ctrl.foreground || FOREGROUND;
                qr.size = ctrl.size || SIZE;
                qr.value = ctrl.value;
                canvas.removeClass('hidden');
            }
        };

        ctrl.removeCode = function () {
            canvas.addClass('hidden');
        };

        ctrl.$onInit = ctrl.setCode.bind(ctrl);

        ctrl.$onChanges = function (changes) {
            if (changes.value) {
                ctrl.setCode();
            }
        };

    }

    angular
        .module('app.shared')
        .component('wavesQrCode', {
            controller: QrCodeController,
            bindings: {
                size: '<',
                background: '<',
                foreground: '<',
                value: '<'
            },
            template: '<canvas class="hidden"></canvas>'
        });
})();
