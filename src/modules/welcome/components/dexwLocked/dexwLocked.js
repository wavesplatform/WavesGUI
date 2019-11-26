(() => {
    'use strict';

    const ds = require('data-service');

    class DexwLockedCtrl {

        static $inject = [
            '$scope',
            '$state',
            'user',
            'exportStorageService',
            'storage'
        ];

        /**
         * @type {boolean}
         */
        isDesktop = false;
        /**
         * @type {'new' | 'old' | 'multiAccount'}
         */
        userType = 'new';
        /**
         * @type {string}
         */
        wavesExchangeLink = WavesApp.network.wavesExchangeLink;

        /**
         * @return {boolean}
         */
        get isAuthorised() {
            return this.user.isAuthorised;
        }

        constructor($scope, $state, user, exportStorageService, storage) {
            this.$scope = $scope;
            this.$state = $state;
            this.user = user;
            this.exportStorageService = exportStorageService;
            this.storage = storage;
        }

        $onInit() {
            this.isDesktop = WavesApp.isDesktop();
            Promise.all([
                this.user.getMultiAccountUsersCount(),
                this.user.getFilteredUserList()
            ]).then(([multiAccountCount, userList]) => {
                if (userList && userList.length && multiAccountCount === 0) {
                    this.userType = 'old';
                } else if (multiAccountCount) {
                    this.userType = 'multiAccount';
                } else {
                    this.userType = 'new';
                }
                this.$scope.$apply();
            });
        }

        onSign() {
            Promise.all([
                this.user.getMultiAccountUsers(),
                this.user.getMultiAccountSettings()
            ])
                .then(([multiAccountUsers, commonSettings]) => {
                    const [firstUser] = multiAccountUsers;

                    this.user.setMultiAccountSettings(commonSettings);

                    if (firstUser) {
                        return this.user.login(firstUser);
                    } else {
                        return Promise.resolve();
                    }

                })
                .then(() => {
                    this.$scope.$apply();
                })
                .catch(() => {
                    return null;
                });
        }

        moving() {
            analytics.send({
                name: 'Start migration',
                target: 'all'
            });

            if (this.isDesktop) {
                this.$state.go('desktopUpdate');
            } else {
                this._export();
            }
        }

        download() {
            // console.info('download');
        }

        _export() {
            const connectProvider = this._getConnectProvider();

            this.exportStorageService.export({
                provider: connectProvider,
                attempts: 20,
                timeout: 2000
            });

            this.exportStorageService.onData().then(result => {
                if (result.payload === 'ok') {
                    this.$scope.$apply();

                    analytics.send({
                        name: 'End migration',
                        target: 'all'
                    });

                    return this.storage.save('migrationSuccess', true);
                } else {
                    analytics.send({
                        name: 'Bad migration',
                        target: 'all'
                    });

                    this.$scope.$apply();

                    return this.storage.save('migrationSuccess', false);
                }
            });
        }

        /**
         * @returns {ConnectProvider}
         */
        _getConnectProvider() {
            const origins = WavesApp.isProduction() ?
                WavesApp.network.migration.origins :
                '*';

            const childWindow = window.open(WavesApp.network.migration.webUrl);

            return new ds.connect.PostMessageConnectProvider({
                win: childWindow,
                mode: 'export',
                origins
            });
        }

    }

    angular.module('app.welcome').component('wDexwLocked', {
        templateUrl: 'modules/welcome/components/dexwLocked/dexwLocked.html',
        controller: DexwLockedCtrl
    });
})();
