(function () {
    'use strict';

    const MODULE_PATH = 'modules/ui/directives/qrCodeRead';

    /**
     * @param {Base} Base
     * @param {JQuery} $element
     * @param {QrCodeReadService} QrCodeReadService
     * @param {$templateRequest} $templateRequest
     * @param {app.utils} utils
     * @param {$compile} $compile
     * @param {$rootScope.Scope} $scope
     * @param {app.utils.decorators} decorators
     * @return {QrCodeRead}
     */
    const controller = function (Base,
                                 $element,
                                 QrCodeReadService,
                                 $templateRequest,
                                 utils,
                                 $compile,
                                 $scope,
                                 decorators) {

        const VIDEO_WRAPPER_SELECTOR = '.js-camera-wrapper';

        class QrCodeRead extends Base {

            /**
             * @return {boolean}
             */
            get videoPending() {
                return !this.isWatched || (!this.videoSize && !this.videoError);
            }

            /**
             * @type {number}
             */
            maxWidth = null;
            /**
             * @type {number}
             */
            maxHeight = null;
            /**
             * @type {boolean}
             */
            isWatched = false;
            /**
             * @type {HTMLElement}
             */
            popupNode = null;
            /**
             * @type {Function}
             */
            onRead = null;
            /**
             * @type {QrCodeReadService}
             */
            readService = null;
            /**
             * @type {QrCodeReadService.ISize}
             */
            videoSize = null;
            /**
             * @type {Promise<string>}
             */
            templatePromise = $templateRequest(`${MODULE_PATH}/cameraPopup.html`);
            /**
             * @type {boolean}
             */
            videoError = false;


            constructor() {
                super();

                this.observe('isWatched', this._dropLastVideoSize);
                this.observe(['isWatched', 'videoSize'], this._onChangeWatched);
                this.observe('videoSize', this._onChangeVideoSize);

                const positionHandler = utils.debounceRequestAnimationFrame(() => this._onChangePosition());

                this.listenEventEmitter(window, 'resize', positionHandler, {
                    on: 'addEventListener',
                    off: 'removeEventListener'
                });

                this.listenEventEmitter(document, 'scroll', positionHandler, {
                    on: 'addEventListener',
                    off: 'removeEventListener',
                    capture: true
                });
            }


            $onDestroy() {
                super.$onDestroy();
                this._removeReadQrService();
                this._removePopup();
            }

            toggleWatchQrCode() {
                if (this.isWatched) {
                    this.stopWatchQrCode();
                    return null;
                }

                this.videoError = false;
                this.isWatched = true;
                this.webCamError = false;

                this._createPopup()
                    .then(() => this._createReadQrService());
            }

            stopWatchQrCode() {
                this.isWatched = false;
                this._removeReadQrService();
            }

            /**
             * @private
             */
            _onChangePosition() {
                if (this.isWatched) {
                    this._setPopupPosition();
                }
            }

            /**
             * @return {QrCodeRead}
             * @private
             */
            _createReadQrService() {
                if (!this.readService) {
                    const $element = $(this.popupNode).find(VIDEO_WRAPPER_SELECTOR);

                    const maxSize = {
                        width: this.maxWidth,
                        height: this.maxHeight
                    };

                    this.readService = new QrCodeReadService({ $element, maxSize });

                    this.receiveOnce(this.readService.onRead, this._onSuccessReadQrCode, this);
                    this.receiveOnce(this.readService.onError, this._onErrorRead, this);
                    this.receiveOnce(this.readService.onHasSize, this._onAddVideoSize, this);
                }

                return this;
            }

            /**
             * @private
             */
            @decorators.async()
            _onErrorRead() {
                this.videoError = true;
                this._setPopupPosition();
                $scope.$apply();
            }

            /**
             * @param size
             * @private
             */
            @decorators.async()
            _onAddVideoSize(size) {
                this.videoSize = size;
                $scope.$apply();
            }

            /**
             * @param text
             * @private
             */
            @decorators.async()
            _onSuccessReadQrCode(text) {
                this.onRead({ text });
                this.isWatched = false;
            }

            /**
             * @return {QrCodeRead}
             * @private
             */
            _removeReadQrService() {
                if (this.readService) {
                    this.stopReceive(this.readService.onRead);
                    this.stopReceive(this.readService.onError);
                    this.stopReceive(this.readService.onHasSize);
                    this.readService.destroy();
                    this.readService = null;
                    this.videoSize = null;
                }

                return this;
            }

            /**
             * @private
             */
            _onChangeVideoSize() {
                this._addPopupSize();
                this._setPopupPosition();
            }

            /**
             * @private
             */
            _createPopup() {
                if (this.popupNode) {
                    return Promise.resolve();
                }

                return this.templatePromise.then(template => {
                    const $node = $compile(template)($scope);
                    this.popupNode = $node.get(0);
                    document.body.appendChild(this.popupNode);
                    this._onChangeWatched();
                    this._setPopupPosition();
                });
            }

            /**
             * @private
             */
            _removePopup() {
                if (this.popupNode) {
                    document.body.removeChild(this.popupNode);
                }
            }

            /**
             * @private
             */
            _onChangeWatched() {
                if (this.popupNode) {
                    this.popupNode.classList.toggle('active', this.isWatched);
                    if (this.isWatched) {
                        this._setPopupPosition();
                    }
                }
            }

            /**
             * @private
             */
            _dropLastVideoSize() {
                if (!this.isWatched) {
                    this.stopWatchQrCode();
                }
            }

            /**
             * @private
             */
            _setPopupPosition() {
                const $btn = $element.find('.btn');
                const offset = $btn.offset();
                const videoWrapper = this.popupNode.querySelector(VIDEO_WRAPPER_SELECTOR);
                const width = videoWrapper.clientWidth;
                const height = videoWrapper.clientHeight;

                const top = offset.top - height / 2 + $btn.height() / 2;
                const left = offset.left - (width + 10);

                $(this.popupNode).find(VIDEO_WRAPPER_SELECTOR)
                    .offset({ top, left });
            }

            /**
             * @private
             */
            _addPopupSize() {
                if (!this.videoSize) {
                    return null;
                }

                const videoWrapper = this.popupNode.querySelector(VIDEO_WRAPPER_SELECTOR);
                const factor = Math.min(this.maxWidth / this.videoSize.width, this.maxHeight / this.videoSize.height);

                const width = Math.round(this.videoSize.width * factor);
                const height = Math.round(this.videoSize.height * factor);

                videoWrapper.style.width = `${width}px`;
                videoWrapper.style.height = `${height}px`;
            }

        }

        return new QrCodeRead();
    };

    controller.$inject = [
        'Base',
        '$element',
        'QrCodeReadService',
        '$templateRequest',
        'utils',
        '$compile',
        '$scope',
        'decorators'
    ];

    angular.module('app.ui')
        .component('wQrCodeRead', {
            bindings: {
                maxWidth: '<',
                maxHeight: '<',
                onRead: '&'
            },
            templateUrl: `${MODULE_PATH}/qrCodeRead.html`,
            controller
        });
})();
