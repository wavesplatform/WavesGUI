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
                this.stream = stream;
            }

            stop() {
                this.stream.getTracks()[0].stop();
            }

        }

        function getFacingBackCamera(devices) {
            let facingBackCamera = devices.find((device) => device.label.includes('back'));

            if (!facingBackCamera) {
                facingBackCamera = devices.find((device) => device.kind === 'videoinput');
            }

            return facingBackCamera || null;
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

                    navigator.mediaDevices.enumerateDevices().then((deviceList) => {
                        const deviceInfo = getFacingBackCamera(deviceList);

                        const constraints = {
                            video: {
                                deviceId: { exact: deviceInfo.deviceId }
                            }
                        };

                        return navigator.mediaDevices.getUserMedia(constraints);
                    }).then(handler, reject);
                });
            }
        };
    };

    factory.$inject = ['$q'];

    angular.module('app.utils')
        .factory('mediaStream', factory);
})();
