(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {Waves} waves
     * @param {User} user
     * @param {IPollCreate} createPoll
     * @return {SettingsCtrl}
     */
    const controller = function (Base, $scope, waves, user, createPoll) {

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
                this.scamListUrl = '';
                this.withScam = false;
                this.shareStat = user.getSetting('shareAnalytics');
                /**
                 * @type {number}
                 */
                this.logoutAfterMin = null;

                this.appName = WavesApp.name;
                this.appVersion = WavesApp.version;
                this.supportLink = WavesApp.network.support;
                this.supportLinkName = WavesApp.network.support.replace(/^https?:\/\//, '');
                this.blockHeight = 0;

                this.syncSettings({
                    node: 'network.node',
                    matcher: 'network.matcher',
                    logoutAfterMin: 'logoutAfterMin',
                    scamListUrl: 'scamListUrl',
                    withScam: 'withScam'
                });

                this.observe('withScam', () => {
                    const withScam = this.withScam;
                    if (withScam) {
                        waves.node.assets.giveMyScamBack();
                    } else {
                        waves.node.assets.stopScam();
                    }
                });

                this.observe(['node', 'matcher'], () => {
                    ds.config.setConfig({
                        node: this.node,
                        matcher: this.matcher
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

                this.observe('shownSeed', () => {
                    analytics.push('Settings', 'Settings.ShowSeed');
                });

                this.observe('shownKey', () => {
                    analytics.push('Settings', 'Settings.ShowKeyPair');
                });

                createPoll(this, waves.node.height, (height) => {
                    this.blockHeight = height;
                    $scope.$digest();
                }, 5000);

                Promise.all([
                    ds.signature.getSignatureApi().getSeed(),
                    ds.signature.getSignatureApi().getPrivateKey()
                ]).then(([seed, key]) => {
                    this.phrase = seed;
                    this.privateKey = key;
                    $scope.$digest();
                });
            }

            onChangeLanguage(language) {
                user.setSetting('lng', language);
                analytics.push('Settings', 'Settings.ChangeLanguage', language);
            }

            setNetworkDefault() {
                this.node = WavesApp.network.node;
                this.matcher = WavesApp.network.matcher;
                this.withScam = false;
                this.scamListUrl = WavesApp.network.scamListUrl;
            }

        }

        return new SettingsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'waves', 'user', 'createPoll'];

    angular.module('app.utils').controller('SettingsCtrl', controller);

})();
