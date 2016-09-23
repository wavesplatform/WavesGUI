(function () {
    'use strict';

    angular
        .module('app.navigation')
        .controller('navigationController', ['$scope', function ($scope) {
            var nav = this;

            nav.currentTab = 'wallet';
            nav.changeTab = changeTab;

            function changeTab (pageId) {
                nav.currentTab = pageId;
            }
        }]);
})();
