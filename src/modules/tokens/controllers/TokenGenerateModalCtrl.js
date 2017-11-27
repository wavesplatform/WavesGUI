(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class TokenGenerateModalCtrl extends Base {

            constructor({ amount, name, precision }) {
                super($scope);
                this.amount = amount;
                this.name = name;
                this.precision = precision;
                this.title = null;
            }
        }

        return new TokenGenerateModalCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.tokens').controller('TokenGenerateModalCtrl', controller);
})();
