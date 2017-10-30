(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {app.utils.apiWorker} apiWorker
     * @param {AssetsService} assetsService
     * @param {NotificationsManager} notificationsManager
     * @param {app.utils} utils
     * @return {AccountInformationCtrl}
     */
    const controller = function (Base, $scope, user, apiWorker, assetsService, notificationsManager, utils) {

        class AccountInformationCtrl extends Base {

            constructor() {
                super($scope);
                this.address = user.address;
                this.createAliasStep = 0;
                this.newAlias = '';

                assetsService.getFeeSend().then((feeData) => {
                    this.feeData = feeData;
                    assetsService.getAssetInfo(feeData.id).then((info) => {
                        this.feeData.name = info.name;
                    });
                });

                apiWorker.process((Waves, { address, code }) => {
                    return Waves.API.Node.v1.aliases.byAddress(address)
                        .then((aliases) => aliases.map((item) => item.replace(`alias:${code}:`, '')))
                        .then((aliases) => aliases.sort(utils.comparators.asc));
                }, { address: user.address, code: WavesApp.network.code }).then((aliases) => {
                    this.aliases = aliases;
                });
            }

            createAlias() {
                user.getSeed().then((seed) => {
                    apiWorker.process((Waves, { alias, seed }) => {
                        return Waves.API.Node.v1.aliases.createAlias({ alias }, seed.keyPair);
                    }, { alias: this.newAlias, seed }).then((data) => {
                        this.aliases.push(data.alias);
                        this.newAlias = '';
                        this.createAliasStep = 0;
                        notificationsManager.info({
                            ns: 'app.utils',
                            literal: 'modal.account.notifications.aliasCreated'
                        });
                    });
                });
            }

            reset() {
                this.newAlias = '';
            }

        }

        return new AccountInformationCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'apiWorker', 'assetsService', 'notificationsManager', 'utils'];

    angular.module('app.utils').controller('AccountInformationCtrl', controller);
})();
