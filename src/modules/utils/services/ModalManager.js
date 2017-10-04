(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param {User} user
     * @returns {ModalManager}
     */
    const factory = function ($mdDialog) {


        const DEFAULT_OPTIONS = {
            clickOutsideToClose: true,
            escapeToClose: true,
            autoWrap: false,
            multiple: true
        };


        class ModalManager {

            /**
             * @param {string} assetId
             * @param {User} user
             * @returns {Promise}
             */
            showSendAsset(assetId, user) {
                return user.getSetting('baseAssetId').then((baseAssetId) => this._getModal({
                    controller: 'AssetSendCtrl',
                    templateUrl: '/modules/utils/modals/sendAsset/send.modal.html',
                    locals: { assetId, baseAssetId }
                }));
            }

            /**
             * @param {IAssetInfo} asset
             * @returns {Promise}
             */
            showReceiveAsset(asset) {
                return this._getModal({
                    locals: { asset },
                    templateUrl: '/modules/utils/modals/receiveAsset/receive.modal.html',
                    controller: 'AssetReceiveCtrl'
                });
            }

            /**
             * @returns {Promise}
             */
            getSeed() {
                return this._getModal({
                    templateUrl: '/modules/utils/modals/enterPassword/enterPassword.modal.html',
                    controller: 'EnterPasswordCtrl'
                });
            }

            /**
             * @param options
             * @private
             */
            _getModal(options) {
                const target = tsUtils.merge(Object.create(null), DEFAULT_OPTIONS, options);
                if (target.locals) {
                    target.bindToController = true;
                }
                if (target.controller) {
                    target.controller = this._setCtrlName(target.controller);
                }
                return $mdDialog.show(target);
            }

            /**
             * @param {string} name
             * @returns {string}
             * @private
             */
            _setCtrlName(name) {
                return name.includes(' as ') ? name : `${name} as $ctrl`;
            }

        }

        return new ModalManager();
    };

    factory.$inject = ['$mdDialog'];

    angular.module('app.utils').factory('modalManager', factory);
})();
