(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class SignButton extends Base {

            /**
             * @type {boolean}
             */
            disabled = false;
            /**
             * @type {Signable}
             */
            signable = null;
            /**
             * @type {Function}
             */
            onSuccess = null;
            /**
             * @type {Function}
             */
            onCancel = null;
            /**
             * @type {Function}
             */
            onClick = null;
            /**
             * @type {boolean}
             */
            signPending = false;


            onSignSuccess() {
                this.signPending = false;
                const signable = this.signable;
                this.signable = null;
                this.onSuccess({ signable });
            }

            onSignCancel() {
                this.signPending = false;
                this.signable = null;
                this.onCancel();
            }

            onClickButton() {
                const some = this.onClick();
                if (!some) {
                    throw new Error('Has no signable!');
                }

                if (SignButton.isPromiseLike(some)) {
                    some.then(signable => {
                        this.signable = signable;
                        $scope.$apply();
                    });
                } else {
                    this.signable = some;
                }

                this.signPending = true;
            }

            static isPromiseLike(some) {
                return some && some.then && typeof some.then === 'function';
            }

        }

        return new SignButton();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.ui').component('wSignButton', {
        controller,
        scope: false,
        bindings: {
            disabled: '<',
            onClick: '&',
            onSuccess: '&',
            onCancel: '&'
        },
        transclude: true,
        templateUrl: 'modules/ui/directives/signButton/sign-button.html'
    });
})();
