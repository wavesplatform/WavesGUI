(function () {
    'use strict';

    angular
        .module('app.portfolio')
        .directive('fileSelect', [function WavesFileSelectDirective() {
            return {
                restrict: 'A',
                scope: {
                    fileHandler: '&'
                },
                link: function (scope, element) {
                    element.on('change', function (changeEvent) {
                        var files = changeEvent.target.files;
                        if (files.length) {
                            scope.fileHandler({file: files[0]});
                        }
                    });
                }
            };
        }]);
})();
