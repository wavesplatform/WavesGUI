(function () {
    'use strict';

    /**
     * @name app.utils.mediaStream
     */

    /**
     * @param $q
     * @return {app.utils.mediaStream}
     */
    const factory = function ($q) {

        class MediaStream {

            constructor(stream) {
                this._stream = stream;
                /**
                 * @type {string}
                 */
                this.url = window.URL.createObjectURL(stream);
            }

            stop() {
                this._stream.getTracks()[0].stop();
            }

        }

        return {
            /**
             * @name app.utils.mediaStream#create
             * @return {Promise<MediaStream>}
             */
            create() {
                return $q((resolve, reject) => {
                    const handler = function (stream) {
                        resolve(new MediaStream(stream));
                    };

                    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        navigator.mediaDevices.getUserMedia({ video: true })
                            .then(handler, reject);
                    } else if (navigator.getUserMedia) { // Standard
                        navigator.getUserMedia({ video: true }, handler, reject);
                    } else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
                        navigator.webkitGetUserMedia({ video: true }, handler, reject);
                    } else if (navigator.mozGetUserMedia) { // Mozilla-prefixed
                        navigator.mozGetUserMedia({ video: true }, handler, reject);
                    }
                });
            }
        };
    };

    factory.$inject = ['$q'];

    angular.module('app.utils')
        .factory('mediaStream', factory);
})();
