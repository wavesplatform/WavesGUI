(function () {
    'use strict';

    const BACKGROUND = `#fff`;
    const FOREGROUND = `#000`;
    const SIZE = 150;

    function QrCode($element) {

        const ctrl = this;
        const canvas = $element.children(`canvas`);
        const qr = new QRious({
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
                canvas.removeClass(`hidden`);
            }
        };

        ctrl.removeCode = function () {
            canvas.addClass(`hidden`);
        };

        ctrl.$onInit = ctrl.setCode.bind(ctrl);

        ctrl.$onChanges = function (changes) {
            if (changes.value) {
                ctrl.setCode();
            }
        };

    }

    angular
        .module(`app.shared`)
        .component(`wavesQrCode`, {
            controller: QrCode,
            bindings: {
                size: `<`,
                background: `<`,
                foreground: `<`,
                value: `<`
            },
            template: `<canvas class="hidden"></canvas>`
        });
})();
