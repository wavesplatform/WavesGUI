(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @return {SettingsCtrl}
     */
    const controller = function (Base, $scope, user) {

        class SettingsCtrl extends Base {

            constructor() {
                super($scope);
                this.tab = 'general';
                this.address = user.address;
                this.publicKey = user.publicKey;
                this.shownSeed = false;
                this.shownKey = false;
                this.node = '';
                this.matcher = '';
                this.shareStat = user.getSetting('shareAnalytics');
                this.version = WavesApp.version;

                this.syncSettings({
                    node: 'network.node',
                    matcher: 'network.matcher'
                });

                this.observe(['node', 'matcher'], () => {
                    Waves.config.set({
                        nodeAddress: this.node,
                        matcherAddress: this.matcher
                    });
                });

                this.observe('shareStat', () => {
                    if (this.shareStat) {
                        analytics.activate();
                        user.setSetting('shareAnalytics', true);
                    } else {
                        analytics.deactivate();
                        user.setSetting('shareAnalytics', false);
                    }
                });

                user.getSeed().then((seed) => {
                    this.phrase = seed.phrase;
                    this.privateKey = seed.keyPair.privateKey;
                });
            }

            setNetworkDefault() {
                this.node = WavesApp.network.node;
                this.matcher = WavesApp.network.matcher;
            }

            setState(state) {
                this.tab = state;
            }

        }

        return new SettingsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user'];

    angular.module('app.utils').controller('SettingsCtrl', controller);
})();
