(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {Waves} waves
     * @param {User} user
     * @param {IPollCreate} createPoll
     * @param {*} $templateRequest
     * @param {app.utils} utils
     * @return {SettingsCtrl}
     */
    const controller = function (Base, $scope, waves, user, createPoll, $templateRequest, utils) {

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
                this.theme = user.getSetting('theme');
                this.candle = user.getSetting('candle');
                this.shareStat = user.getSetting('shareAnalytics');
                this.templatePromise = $templateRequest('modules/utils/modals/settings/loader.html');

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
                    withScam: 'withScam',
                    theme: 'theme',
                    candle: 'candle'
                });

                this.observe('theme', () => {
                    this.templatePromise.then(
                        (template) => {
                            template = template.replace('{{bgColor}}', user.getThemeSettings().bgColor);
                            this.showLoader(template);
                            utils.wait(1000).then(() => user.changeTheme(this.theme));
                        },
                        () => user.changeTheme(this.theme)
                    );
                });

                // this.observe('candle', () => {
                //     user.changeCandle(this.candle);
                // });

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
                    analytics.push('Settings', `Settings.ShowSeed.${WavesApp.type}`);
                });

                this.observe('shownKey', () => {
                    analytics.push('Settings', `Settings.ShowKeyPair.${WavesApp.type}`);
                });

                createPoll(this, waves.node.height, (height) => {
                    this.blockHeight = height;
                    $scope.$digest();
                }, 5000);

                Promise.all([
                    ds.signature.getSignatureApi().getSeed(),
                    ds.signature.getSignatureApi().getPrivateKey(),
                    ds.signature.getSignatureApi().getPublicKey()
                ]).then(([seed, privateKey, publicKey]) => {
                    this.phrase = seed;
                    this.privateKey = privateKey;
                    this.publicKey = publicKey;
                    $scope.$digest();
                });
            }

            onChangeLanguage(language) {
                user.setSetting('lng', language);
                analytics.push('Settings', `Settings.ChangeLanguage.${WavesApp.type}`, language);
            }

            setNetworkDefault() {
                this.node = WavesApp.network.node;
                this.matcher = WavesApp.network.matcher;
                this.withScam = false;
                this.scamListUrl = WavesApp.network.scamListUrl;
            }

            showLoader(template) {
                const loaderEl = document.createElement('div');
                loaderEl.innerHTML = template;
                document.body.appendChild(loaderEl);
                setTimeout(() => {
                    document.body.removeChild(loaderEl);
                }, 4100);
            }

        }

        return new SettingsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'waves', 'user', 'createPoll', '$templateRequest', 'utils'];

    angular.module('app.utils').controller('SettingsCtrl', controller);

})();
