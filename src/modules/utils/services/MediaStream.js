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
                const videoInputDevices = devices.filter((device) => device.kind === 'videoinput');
                // Android devices facing back camera is usually placed later in array of devices.
                facingBackCamera = videoInputDevices[videoInputDevices.length - 1];
            }

            return facingBackCamera || null;
        }

        function getConstraints(deviceList) {
            if (navigator.mediaDevices.getSupportedConstraints().facingMode) {
                return {
                    video: {
                        facingMode: 'environment'
                    }
                };
            }

            const deviceInfo = getFacingBackCamera(deviceList);

            return {
                video: {
                    deviceId: { exact: deviceInfo.deviceId }
                }
            };
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
                        return (
                            navigator
                                .mediaDevices
                                .getUserMedia(
                                    getConstraints(deviceList)
                                )
                        );
                    }).then(handler, reject);
                });
            }
        };
    };

    factory.$inject = ['$q'];

    angular.module('app.utils')
        .factory('mediaStream', factory);
})();
