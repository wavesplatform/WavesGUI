(function () {
    'use strict';

    angular
        .module('app.core.services')
        .service('utilityService', [function () {

            this.longToByteArray = function (value) {

                var bytes = new Array(7);
                for (var k = 7; k >= 0; k--) {
                    bytes[k] = value & (255);
                    value = value / 256;
                }

                return bytes;
            };

            this.getTime = function() {
                return Date.now();
            };

            this.isEnterKey = function (charCode) {
                return (charCode == 10 || charCode == 13);
            };
        }]);
})();
