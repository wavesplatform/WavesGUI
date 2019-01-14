(function () {
    'use strict';

    const { SIGN_TYPE } = require('@waves/signature-adapter');
    const $ = require('jquery');

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {$mdDialog} $mdDialog
     * @param {User} user
     * @return {SignByDeviceCtrl}
     */
    const controller = function (Base, $scope, $mdDialog, user) {

        class SignByDeviceCtrl extends Base {

            /**
             * @type {JQuery.Deferred<Signable>}
             */
            deferred = $.Deferred();
            /**
             * @type {string}
             */
            mode = '';
            /**
             * @type {boolean}
             */
            loading = true;
            /**
             * @type {boolean}
             */
            isLedger = false;
            /**
             * @type {boolean}
             */
            isKeeper = false;
            /**
             * @type {*}
             */
            txData = null;
            /**
             * @type {Money}
             */
            total;

            /**
             * @param {Signable} signable
             */
            constructor(signable) {
                super($scope);

                this.mode = SignByDeviceCtrl.getSignMode(signable.type);

                signable.getId().then(id => {
                    this.txId = id;
                    $scope.$apply();
                });

                this.txData = signable.getTxData();

                if (this.txData.price) {
                    this.total = this.txData.price.cloneWithTokens(
                        this.txData.price.getTokens().times(this.txData.amount.getTokens())
                    );
                }

                this.isLedger = user.userType === 'ledger';
                this.isKeeper = user.userType === 'wavesKeeper';

                this.deferred.promise()
                    .then(signable => {
                        this.onLoad(signable);
                    })
                    .catch(error => {
                        this.onError(error);
                    });

                signable.getSignature()
                    .then(() => {
                        this.deferred.resolve(signable);
                    })
                    .catch(error => {
                        this.deferred.reject(error);
                    });
            }

            onClose() {
                this.deferred.reject();
            }

            onLoad(signable) {
                $mdDialog.hide(signable);
                $scope.$destroy();
            }

            onError(error) {
                $mdDialog.cancel(error);
                $scope.$destroy();
            }

            /**
             * @param {SIGN_TYPE} type
             * @return string
             */
            static getSignMode(type) {
                switch (type) {
                    case SIGN_TYPE.CREATE_ORDER:
                        return 'create-order';
                    case SIGN_TYPE.CANCEL_ORDER:
                        return 'cancel-order';
                    case SIGN_TYPE.MATCHER_ORDERS:
                        return 'sign-matcher';
                    default:
                        throw new Error('Wrong sign type!');
                }
            }

        }

        return new SignByDeviceCtrl(this.signable);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog', 'user'];

    angular.module('app.ui')
        .controller('SignByDeviceCtrl', controller);
})();
