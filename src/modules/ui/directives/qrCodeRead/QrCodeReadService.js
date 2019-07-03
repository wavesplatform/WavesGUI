(function () {
    'use strict';

    const DEFAULT_READ_COUNT = 4;

    /**
     * @param {app.utils.mediaStream} mediaStream
     * @param {Poll} Poll
     * @return {QrCodeReadService}
     */
    const factory = function (mediaStream, Poll) {

        const { Signal } = require('ts-utils');
        const wrapper = require('worker-wrapper');


        class QrCodeReadService {

            /**
             * @type {Signal<string>}
             */
            onRead = new Signal();
            /**
             * @type {Signal<Error>}
             */
            onError = new Signal();
            /**
             * @type {Signal<QrCodeReadService.ISize>}
             */
            onHasSize = new Signal();
            /**
             * @type {QrCodeReadService.ISize}
             */
            size = null;
            /**
             * @type {HTMLCanvasElement}
             * @private
             */
            _canvas = document.createElement('CANVAS');
            /**
             * @type {CanvasRenderingContext2D}
             * @private
             */
            _ctx = null;
            /**
             * @type {MediaStream}
             * @private
             */
            _stream = null;
            /**
             * @type {HTMLMediaElement}
             * @private
             */
            _video = document.createElement('VIDEO');
            /**
             * @type {Wrap}
             * @private
             */
            _worker = null;
            /**
             * @type {Poll}
             * @private
             */
            _poll = null;
            /**
             * @type {Object.<string, number>}
             * @private
             */
            _readQrHash = Object.create(null);
            /**
             * @type {number}
             * @private
             */
            _readCount = DEFAULT_READ_COUNT;
            /**
             * @type {ISize}
             * @private
             */
            _maxSize = null;
            /**
             * @type {number}
             * @private
             */
            _factor = 1;


            /**
             * @param {QrCodeReadService.IOptions} options
             * @constructor
             */
            constructor(options) {
                if (options.readCount) {
                    this._readCount = options.readCount;
                }

                this._maxSize = options.maxSize;

                this._initializeDom(options);

                requestAnimationFrame(() => {
                    this._createWorker()
                        ._createStream()
                        .then(() => this._loadVideoSize())
                        .then(() => this._createPoll())
                        .catch((e) => this._dispatchError(e));
                });
            }

            destroy() {
                this._removeWorker()
                    ._clearSignalHandlers()
                    ._stopStream()
                    ._removePoll()
                    ._removeVideoElement();
            }

            /**
             * @param {QrCodeReadService.IOptions} options
             * @private
             */
            _initializeDom(options) {
                this._createContext()
                    ._addVideoAttrs();

                // For debug read camera square
                // this._canvas.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 10000';
                // document.body.appendChild(this._canvas);

                options.$element.append(this._video);
                return this;
            }

            /**
             * @private
             */
            _removeVideoElement() {
                if (this._video.parentNode) {
                    this._video.parentNode.removeChild(this._video);
                }

                return this;
            }

            /**
             * @return {QrCodeReadService}
             * @private
             */
            _createContext() {
                this._ctx = this._canvas.getContext('2d');
                return this;
            }

            /**
             * @private
             */
            _addVideoAttrs() {
                this._video.setAttribute('autoplay', 'true');
                this._video.setAttribute('preload', 'auto');
                this._video.setAttribute('muted', 'true');
                this._video.setAttribute('playsinline', 'true');

                return this;
            }

            /**
             * @private
             */
            _clearSignalHandlers() {
                this.onRead.off();
                this.onError.off();

                return this;
            }

            /**
             * @private
             */
            _removeWorker() {
                if (this._worker) {
                    this._worker.terminate();
                    this._worker = null;
                }

                return this;
            }

            /**
             * @private
             */
            _stopStream() {
                if (this._stream) {
                    this._stream.stop();
                    this._stream = null;
                }

                return this;
            }

            /**
             * @return {QrCodeReadService}
             * @private
             */
            _createWorker() {
                if (this._worker) {
                    return this;
                }

                this._worker = wrapper.create(() => new QrCode(), {
                    libs: [`/node_modules/qrcode-reader/dist/index.min.js?${WavesApp.version}`]
                });

                return this;
            }

            /**
             * @return {QrCodeReadService}
             * @private
             */
            _createPoll() {
                if (this._poll) {
                    return this;
                }

                this._poll = new Poll(() => this._decodeImage(), result => this._checkStop(result), 1000 / 24);

                return this;
            }

            /**
             * @return {QrCodeReadService}
             * @private
             */
            _removePoll() {
                if (!this._poll) {
                    return this;
                }

                this._poll.destroy();
                this._poll = null;

                return this;
            }

            /**
             * @return {Promise<T | never>}
             * @private
             */
            _createStream() {
                return mediaStream.create()
                    .then(stream => {
                        this._stream = stream;
                        this._video.srcObject = stream.stream;
                    });
            }

            /**
             * @return {Promise}
             * @private
             */
            _loadVideoSize() {
                return new Promise((resolve) => {
                    const handler = () => {
                        this.size = { width: this._video.videoWidth, height: this._video.videoHeight };

                        const factor = this._maxSize && Math.min(
                            this._maxSize.width / this.size.width,
                            this._maxSize.height / this.size.height
                        ) || 1;

                        this._factor = factor;
                        this._video.style.transform = `scale(${factor}) translate(-50%, -50%)`;
                        this._video.style.transformOrigin = '0 0';
                        this._canvas.width = this.size.width;
                        this._canvas.height = this.size.height;

                        this.onHasSize.dispatch({ ...this.size });
                        this._video.removeEventListener('loadedmetadata', handler, false);
                        resolve();
                    };
                    this._video.addEventListener('loadedmetadata', handler, false);
                });
            }

            /**
             * @return {Promise<string>}
             * @private
             */
            _decodeImage() {
                if (!this.size || !this.size.width || !this.size.height) {
                    return null;
                }

                const frame = this._getFrame();

                return this._worker.process((qr, { frame }) => {
                    return new Promise((resolve) => {
                        qr.callback = function (error, response) {
                            if (error) {
                                resolve(null);
                            } else {
                                resolve(response.result);
                            }
                        };
                        qr.decode(frame);
                    });
                }, { frame })
                    .catch((e) => this._dispatchError(e));
            }

            /**
             * @param {string} parsedQr
             * @private
             */
            _checkStop(parsedQr) {
                if (!parsedQr) {
                    return null;
                }

                if (!this._readQrHash[parsedQr]) {
                    this._readQrHash[parsedQr] = 1;
                } else {
                    this._readQrHash[parsedQr]++;
                }

                if (this._readQrHash[parsedQr] >= this._readCount) {
                    this.onRead.dispatch(parsedQr);
                    this.destroy();
                }
            }

            /**
             * @return {ImageData}
             * @private
             */
            _getFrame() {
                const factor = 1 / this._factor;
                const size = 170 * factor;
                const width = this.size.width;
                const height = this.size.height;

                const deltaX = (width - size) / 2;
                const deltaY = (height - size) / 2;

                const args = [deltaX, deltaY, size, size, 0, 0, size, size];

                this._ctx.drawImage(this._video, ...args);
                return this._ctx.getImageData(0, 0, size, size);
            }

            /**
             * @param {Error} error
             * @private
             */
            _dispatchError(error) {
                this.onError.dispatch(error);
                this.destroy();
            }

        }

        return QrCodeReadService;
    };

    factory.$inject = ['mediaStream', 'Poll'];

    angular.module('app.ui').factory('QrCodeReadService', factory);
})();

/**
 * @name QrCodeReadService
 */

/**
 * @typedef {object} QrCodeReadService#IOptions
 * @property {JQuery} $element
 * @property {ISize} maxSize
 * @property {number} [readCount] Count of success read for throw success event
 */

/**
 * @typedef {object} QrCodeReadService#ISize
 * @property {number} width
 * @property {number} height
 */
