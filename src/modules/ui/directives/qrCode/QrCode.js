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
                /**
                 * @type {HTMLElement}
                 */
                this.qrNode = document.createElement('DIV');

                $element.append(this.qrNode);
            }

            $onChanges() {
                if (!this.url) {
                    return null;
                } else {
                    QRCode.toDataURL(this.url, (error, encrypted) => {
                        this.qrNode.classList.add('qr-code-wrap');
                        this.qrNode.style.width = `${this.size}px`;
                        this.qrNode.style.height = `${this.size}px`;
                        this.qrNode.innerHTML = `<img style="display: block" src="${encrypted}">`;
                    });
                }
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
