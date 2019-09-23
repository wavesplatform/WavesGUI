(function () {
    'use strict';

    const RESOLUTIONS = {
        FULL_HD: { width: 1920, height: 1080 },
        HD: { width: 1280, height: 720 },
        VGA: { width: 640, height: 480 },
        QVGA: { width: 320, height: 240 }
    };

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
                const videoInputDevices = devices.filter((device) => device.kind === 'videoinput');
                // Android devices facing back camera is usually placed later in array of devices.
                facingBackCamera = videoInputDevices[videoInputDevices.length - 1];
            }

            return facingBackCamera || null;
        }

        function getConstraints(deviceList, resolution) {
            const constraints = {
                video: {
                    width: { exact: resolution.width },
                    height: { exact: resolution.height }
                }
            };

            if (navigator.mediaDevices.getSupportedConstraints().facingMode) {
                constraints.video.facingMode = 'environment';
            } else {
                const deviceInfo = getFacingBackCamera(deviceList);
                constraints.video.deviceId = { exact: deviceInfo.deviceId };
            }


            return constraints;
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

                    const getUserMedia = deviceList => {
                        const mediaDevices = navigator.mediaDevices;

                        const reverse = resolution => ({ width: resolution.height, height: resolution.width });

                        const checkResolution = res => {
                            return mediaDevices.getUserMedia(getConstraints(deviceList, res))
                                .catch(() => mediaDevices.getUserMedia(getConstraints(deviceList, reverse(res))));
                        };

                        return checkResolution(RESOLUTIONS.FULL_HD)
                            .catch(() => checkResolution(RESOLUTIONS.HD))
                            .catch(() => checkResolution(RESOLUTIONS.VGA))
                            .catch(() => checkResolution(RESOLUTIONS.QVGA));
                    };

                    if (!navigator.mediaDevices) {
                        return reject(new Error('navigator.mediaDevices is undefined'));
                    }

                    navigator.mediaDevices.enumerateDevices()
                        .then(getUserMedia)
                        .then(handler, reject);
                });
            }
        };
    };

    factory.$inject = ['$q'];

    angular.module('app.utils')
        .factory('mediaStream', factory);
})();
