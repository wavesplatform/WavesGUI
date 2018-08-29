(function () {
    'use strict';

    /**
     * @param {JQuery} $element
     * @return {QrCode}
     */
    const controller = function ($element) {

        class QrCode {

            constructor() {
                /**
                 * @private
                 * @type {string}
                 */
                this.url = null;
                /**
                 * @private
                 * @type {number}
                 */
                this.size = null;
            }

            $onChanges() {
                if (!this.url) {
                    return null;
                }
                if (this.qrcode) {
                    this.update();
                } else {
                    this.create();
                }
            }

            create() {
                const node = document.createElement('DIV');
                node.classList.add('qr-code-wrap');
                node.style.width = `${this.size}px`;
                node.style.height = `${this.size}px`;
                $element.append(node);
                this.qrcode = new QRCode(node, {
                    text: this.url,
                    width: this.size,
                    height: this.size,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            }

            update() {
                this.qrcode.clear();
                this.qrcode.makeCode(this.url);
            }

        }

        return new QrCode();
    };

    controller.$inject = ['$element'];

    angular.module('app.ui')
        .component('wQrCode', {
            bindings: {
                size: '@',
                url: '<'
            },
            controller
        });
})();
