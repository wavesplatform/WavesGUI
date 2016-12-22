(function () {
    'use strict';

    var MAXIMUM_FILE_SIZE = 1 * 1024 * 1024;

    function WavesMassPaymentController ($scope, $window, notificationService) {
        var mass = this;

        mass.handleFile = handleFile;
        mass.processInputFile = processInputFile;

        function errorHandler(evt) {
            switch(evt.target.error.code) {
                case evt.target.error.NOT_FOUND_ERR:
                    notificationService.error('File Not Found!');
                    break;
                case evt.target.error.NOT_READABLE_ERR:
                    notificationService.error('File is not readable');
                    break;
                case evt.target.error.ABORT_ERR:
                    break; // noop
                default:
                    notificationService.error('An error occurred reading this file.');
            }
        }

        function processInputFile (content) {
            try {
                var transfers = $window.JSON.parse(content);
                //TODO: process transaction array
            }
            catch (ex) {
                notificationService.error('Failed to parse file: ' + ex);
            }
        }

        function handleFile(file) {
            if (file.size > MAXIMUM_FILE_SIZE) {
                notificationService.error('File "' + file.name + '" is too big. Maximum file size is 1Mb.');

                return;
            }

            var reader = new $window.FileReader();

            reader.onloadend = function (event) {
                NProgress.done();

                if (event.target.readyState == FileReader.DONE)
                    mass.processInputFile(event.target.textContent);
            };
            reader.onloadstart = function (event) {
                NProgress.start();
            };
            reader.onabort = function (event) {
                notificationService.error('File read cancelled');
            };
            reader.onerror = errorHandler;

            reader.readAsText(file);
        }
    }

    WavesMassPaymentController.$inject = ['$scope', '$window', 'notificationService'];

    angular
        .module('app.portfolio')
        .controller('massPaymentController', WavesMassPaymentController);
})();
