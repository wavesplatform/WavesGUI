(function () {
    'use strict';

    const ds = require('data-service');

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {Waves} waves
     * @param {User} user
     * @param {IPollCreate} createPoll
     * @param {*} $templateRequest
     * @param {app.utils} utils
     * @param {Storage} storage
     * @param {ModalManager} modalManager
     * @return {SettingsCtrl}
     */
    const controller = function (Base,
                                 $scope,
                                 waves,
                                 user,
                                 createPoll,
                                 $templateRequest,
                                 utils,
                                 storage,
                                 modalManager) {

        class SettingsCtrl extends Base {

            get openLinkViaWeb() {
                return this.openClientMode === 'web';
            }

            set openLinkViaWeb(value) {
                if (value) {
                    this.openClientMode = 'web';
                } else {
                    this.openClientMode = null;
                }
                storage.save('openClientMode', this.openClientMode);
            }

            get advancedMode() {
                return user.getSetting('advancedMode');
            }

            set advancedMode(mode) {
                analytics.push('Settings', 'Settings.ChangeAdvancedMode', String(mode));
                user.setSetting('advancedMode', mode);
            }

            tab = 'general';
            address = user.address;
            publicKey = user.publicKey;
            shownSeed = false;
            shownKey = false;
            node = '';
            matcher = '';
            scamListUrl = '';
            withScam = false;
            theme = user.getSetting('theme');
            candle = user.getSetting('candle');
            shareStat = user.getSetting('shareAnalytics');
            templatePromise = $templateRequest('modules/utils/modals/settings/loader.html');
            openClientMode = null;
            /**
             * @type {number}
             */
            logoutAfterMin = null;

            appName = WavesApp.name;
            appVersion = WavesApp.version;
            supportLink = WavesApp.network.support;
            supportLinkName = WavesApp.network.support.replace(/^https?:\/\//, '');
            blockHeight = 0;

            constructor() {
                super($scope);

                this.syncSettings({
                    node: 'network.node',
                    matcher: 'network.matcher',
                    logoutAfterMin: 'logoutAfterMin',
                    scamListUrl: 'scamListUrl',
                    withScam: 'withScam',
                    theme: 'theme',
                    candle: 'candle'
                });

                storage.load('openClientMode').then(mode => {
                    this.openClientMode = mode;
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

                const catchProcessor = method => {
                    try {
                        return method().catch(() => null);
                    } catch (e) {
                        return Promise.resolve(null);
                    }
                };

                Promise.all([
                    catchProcessor(() => ds.signature.getSignatureApi().getSeed()),
                    catchProcessor(() => ds.signature.getSignatureApi().getPrivateKey()),
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

            showPairingWithMobile() {
                return modalManager.showPairingWithMobile();
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

    controller.$inject = [
        'Base',
        '$scope',
        'waves',
        'user',
        'createPoll',
        '$templateRequest',
        'utils',
        'storage',
        'modalManager'
    ];

    angular.module('app.utils').controller('SettingsCtrl', controller);

})();
