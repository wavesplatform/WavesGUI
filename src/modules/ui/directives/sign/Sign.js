(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {User} user
     * @param {$rootScope.Scope} $scope
     * @return {Sign}
     */
    const controller = function (Base, user, $scope) {

        class Sign extends Base {

            /**
             * @return {boolean}
             */
            get isShown() {
                return user.userType && user.userType !== 'seed' && this.signable;
            }

            /**
             * @type {boolean}
             */
            signPending = false;
            /**
             * @type {Signable}
             */
            signable = null;
            /**
             * @type {boolean}
             */
            signError = false;
            /**
             * @type {string}
             */
            id = '';


            constructor() {
                super();

                this.observe('signable', this._onChangeSignable);
            }

            trySign() {
                this.signError = false;
                this.signPending = true;

                return this.signable.addMyProof()
                    .then(signature => {
                        this.signPending = false;
                        this.onSuccess({ signature });
                    })
                    .catch(() => {
                        this.signPending = false;
                        this.signError = true;
                    })
                    .then(() => {
                        $scope.$apply();
                    });
            }

            cancel() {
                this.signError = false;
                this.signPending = false;
                this.onCancel();
            }

            /**
             * @private
             */
            _onChangeSignable() {
                const signable = this.signable;

                if (signable) {
                    signable.getId().then(id => {
                        this.id = id;
                        $scope.$apply();
                    });
                    this.trySign();
                } else {
                    this.signPending = false;
                    this.id = '';
                }
            }

        }

        return new Sign();
    };

    controller.$inject = ['Base', 'user', '$scope'];

    angular.module('app.ui').component('wSign', {
        scope: false,
        bindings: {
            signable: '<',
            onSuccess: '&',
            onCancel: '&'
        },
        templateUrl: 'modules/ui/directives/sign/sign.html',
        controller
    });
})();
