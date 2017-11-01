(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class TermsAcceptCtrl extends Base {

            constructor() {
                super($scope);
                this.security = false;
                this.backup = false;
                this.agree = false;

                this.license = [ // TODO move to locales
                    {
                        title: 'Agreement',
                        text: 'This is a contract between you and Waves Platform Ltd, a private limited company incorporated in England and Wales or any other legal entity that succeeds Waves Platform Ltd or may be further incorporated (“Company”) and that holds the rights to Waves platform protocol (“Protocol”), website www.wavesplatform.com or any associated websites or mobile applications (“Platform”). '
                    },
                    {
                        title: 'Eligibility',
                        text: 'You are allowed to use the Platform if you are eligible in accordance with the law of your residence. The Company has no obligation or capability to verify whether you are eligible to use the Platform and bears no responsibility for your use of the Platform.'
                    }
                ];
            }

            confirm() {
                this.agree = true;
            }

        }

        return new TermsAcceptCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('TermsAcceptCtrl', controller);
})();
