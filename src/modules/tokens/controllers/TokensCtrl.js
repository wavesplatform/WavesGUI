(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class TokensCtrl extends Base {

            constructor() {
                super($scope);
                this.name = '';
                this.description = '';
                this.issue = true;
                this.count = null;
                this.precision = null;
            }

        }

        return new TokensCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.tokens').controller('TokensCtrl', controller);
})();

