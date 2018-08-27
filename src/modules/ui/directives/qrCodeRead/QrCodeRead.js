(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {JQuery} $element
     * @param {app.utils.mediaStream} mediaStream
     * @param {IPollCreate} createPoll
     * @param {app.utils} utils
     * @return {QrCodeRead}
     */
    const controller = function (Base, $element, mediaStream, createPoll, utils) {

        class QrCodeRead extends Base {

            constructor() {
                super();
                /**
                 * @type {number}
                 */
                this.maxWidth = null;
                /**
                 * @type {number}
                 */
                this.maxHeight = null;
                /**
                 * @type {string}
                 */
                this.position = null;
                /**
                 * @type {boolean}
                 */
                this.isWatched = false;
                /**
                 * @type {HTMLCanvasElement}
                 */
                this.canvas = null;
                /**
                 * @type {CanvasRenderingContext2D}
                 */
                this.ctx = null;
                /**
                 * @type {HTMLDivElement}
                 */
                this.popupNode = null;
                /**
                 * @type {MediaStream}
                 */
                this.stream = null;
                /**
                 * @type {Wrap}
                 * @type {HTMLMediaElement}
                 */
                this.video = document.createElement('VIDEO');
                this.worker = null;
                /**
                 * @type {Function}
                 */
                this.onRead = null;
                /**
                 * @type {boolean}
                 */
                this.webCamError = null;

                this._addVideoAttrs();
                this.observe(['width', 'height'], this._onChangeSize);
                this.observe('isWatched', this._onChangeWatched);
                this.observe('webCamError', this._onChangeVideoError);
            }

            $postLink() {
                this.maxWidth = Number(this.maxWidth);
                this.maxHeight = Number(this.maxHeight);
                if (!this.maxWidth || !this.maxHeight) {
                    throw new Error('Has no QrCode reader size!');
                }
            }

            $onDestroy() {
                super.$onDestroy();
                this._stopStream();
                if (this.worker) {
                    this.worker.terminate();
                }
                if (this.popupNode) {
                    document.body.removeChild(this.popupNode);
                }
            }

            watchQrCode() {
                if (this.isWatched) {
                    this._stopWatchQrCode();
                    return null;
                }

                if (!this.popupNode) {
                    this._createPopup();
                }

                if (!this.worker) {
                    this._createWorker();
                }

                this.isWatched = true;
                this.webCamError = false;
                mediaStream.create()
                    .then((stream) => {
                        this.stream = stream;
                        this._loadVideoSize()
                            .then((size) => {
                                this._applySize(size);
                                this.poll = createPoll(this, this._decodeImage, this._checkStop, 50);
                            });
                        this.video.srcObject = stream.stream;
                    }, () => this._onWebCamError());
            }

            /**
             * @private
             */
            _addVideoAttrs() {
                this.video.setAttribute('autoplay', 'true');
                this.video.setAttribute('preload', 'auto');
                this.video.setAttribute('muted', 'true');
                this.video.setAttribute('playsinline', 'true');
            }

            /**
             * @private
             */
            _onChangeWatched() {
                this.popupNode.classList.toggle('active', this.isWatched);
            }

            /**
             * @private
             */
            _onChangeSize() {
                if (!this.width || !this.height) {
                    return null;
                }
                this._setPopupPosition(this._addPopupSize());
            }

            /**
             * @return {Promise}
             * @private
             */
            _loadVideoSize() {
                return new Promise((resolve) => {
                    const handler = () => {
                        resolve({ width: this.video.videoWidth, height: this.video.videoHeight });
                        this.video.removeEventListener('loadedmetadata', handler, false);
                    };
                    this.video.addEventListener('loadedmetadata', handler, false);
                });
            }

            /**
             * @private
             */
            _stopWatchQrCode() {
                this.isWatched = false;
                if (this.poll) {
                    this.poll.destroy();
                    this.poll = null;
                }
                this._stopStream();
            }

            /**
             * @param size
             * @private
             */
            _applySize(size) {
                this.width = size.width;
                this.height = size.height;
            }

            /**
             * @return {Promise<any>}
             * @private
             */
            _decodeImage() {
                return this.worker.process((qr, { frame }) => {
                    return new Promise((resolve) => {
                        qr.callback = function (error, response) {
                            if (error) {
                                resolve(null);
                            } else {
                                resolve(response);
                            }
                        };
                        qr.decode(frame);
                    });
                }, { frame: this._getFrame() });
            }

            _parseQrCode({ result }) {
                try {
                    const url = new URL(result);
                    const hash = url.hash.replace('#', '');
                    const [path, search] = hash.split('?');
                    const assetId = path.replace('send/', '');
                    const params = utils.parseSearchParams(search);

                    return { ...params, assetId };
                } catch (e) {
                    let data;
                    if (result.includes('://')) {
                        data = result.split('://')[1];
                    } else {
                        data = result;
                    }
                    const [body, search] = (data || '').split('?');
                    return { recipient: body, ...utils.parseSearchParams(search) };
                }

            }

            /**
             * @return {ImageData}
             * @private
             */
            _getFrame() {
                // this.ctx.drawImage(this.video, 0, 0, this.width, this.height);
                return this.ctx.getImageData(0, 0, this.width, this.height);
            }

            /**
             * @private
             */
            _createWorker() {
                this.worker = workerWrapper.create(() => new QrCode(), {
                    libs: ['/node_modules/qrcode-reader/dist/index.min.js']
                });
            }

            /**
             * @private
             */
            _stopStream() {
                if (this.stream) {
                    this.stream.stop();
                    this.stream = null;
                }
            }

            /**
             * @param data
             * @private
             */
            _checkStop(data) {
                if (data) {
                    this._stopWatchQrCode();
                    this.onRead({ result: this._parseQrCode(data) });
                }
            }

            /**
             * @private
             */
            _onWebCamError() {
                this._applySize({ width: this.maxWidth, height: this.maxHeight });
                this._setPopupPosition();
                this._addPopupSize();
                this.webCamError = true;
            }

            /**
             * @private
             */
            _onChangeVideoError() {
                if (this.webCamError) {
                    this.popupNode.classList.add('qr-code-reader-popup__error');
                } else {
                    this.popupNode.classList.remove('qr-code-reader-popup__error');
                }
            }

            /**
             * @private
             */
            _createPopup() {
                this.errorLiteral = null;
                this.popupNode = document.createElement('DIV');
                this.popupNode.classList.add('qr-code-reader-popup');
                this.popupNode.appendChild(this.video);
                this.canvas = document.createElement('CANVAS');
                this.ctx = this.canvas.getContext('2d');
                document.body.append(this.popupNode);
            }

            /**
             * @private
             */
            _setPopupPosition({ width, height }) {
                const $btn = $element.find('.btn');
                const offset = $btn.offset();
                $(this.popupNode)
                    .offset({
                        top: offset.top - height - 10,
                        left: offset.left - (width - $btn.width()) / 2
                    });
            }

            /**
             * @private
             */
            _addPopupSize() {
                const factor = Math.min(Number(this.maxWidth) / this.width, Number(this.maxHeight) / this.height);

                const width = Math.round(this.width * factor);
                const height = Math.round(this.height * factor);

                this.video.width = this.width;
                this.video.height = this.height;

                this.video.style.width = `${width}px`;
                this.video.style.height = `${height}px`;

                this.popupNode.style.width = `${width}px`;
                this.popupNode.style.height = `${height}px`;

                return { width, height };
            }

        }

        return new QrCodeRead();
    };

    controller.$inject = ['Base', '$element', 'mediaStream', 'createPoll', 'utils'];

    angular.module('app.ui')
        .component('wQrCodeRead', {
            bindings: {
                maxWidth: '@',
                maxHeight: '@',
                position: '@',
                onRead: '&'
            },
            template: '<div ng-class="{active: $ctrl.isWatched}" class="btn" ng-click="$ctrl.watchQrCode()"></div>',
            controller
        });
})();
