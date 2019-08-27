(function () {
    'use strict';

    const ds = require('data-service');
    const { path } = require('ramda');
    const analytics = require('@waves/event-sender');

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
                analytics.send({ name: `Settings Advanced Features ${mode ? 'On' : 'Off'}`, target: 'ui' });
                user.setSetting('advancedMode', mode);
            }

            oracleWaves = '';
            tab = 'general';
            address = user.address;
            publicKey = user.publicKey;
            shownSeed = false;
            shownKey = false;
            node = '';
            matcher = '';
            api = '';
            scamListUrl = '';
            tokensNameListUrl = '';
            dontShowSpam = true;
            theme = user.getSetting('theme');
            candle = user.getSetting('candle');
            templatePromise = $templateRequest('modules/utils/modals/settings/loader.html');
            openClientMode = null;
            /**
             * @type {number}
             */
            logoutAfterMin = null;

            appName = WavesApp.name;
            appVersion = WavesApp.version;
            supportLink = WavesApp.network.support;
            termsAndConditionsLink = WavesApp.network.termsAndConditions;
            privacyPolicy = WavesApp.network.privacyPolicy;
            supportLinkName = WavesApp.network.support.replace(/^https?:\/\//, '');
            blockHeight = 0;
            assetsOracleTmp = '';
            oracleWavesData = path(['oracle'], ds.dataManager.getOracleData('oracleWaves'));
            oracleError = false;
            oraclePending = false;
            oracleSuccess = false;

            constructor() {
                super($scope);
                analytics.send({ name: 'Settings General Show', target: 'ui' });

                this.observe('tab', () => {
                    const tabName = this.tab.slice(0, 1).toUpperCase() + this.tab.slice(1);
                    analytics.send({ name: `Settings ${tabName} Show`, target: 'ui' });
                });

                this.isScript = user.hasScript();
                this.syncSettings({
                    node: 'network.node',
                    matcher: 'network.matcher',
                    api: 'network.api',
                    logoutAfterMin: 'logoutAfterMin',
                    scamListUrl: 'scamListUrl',
                    tokensNameListUrl: 'tokensNameListUrl',
                    dontShowSpam: 'dontShowSpam',
                    theme: 'theme',
                    candle: 'candle',
                    oracleWaves: 'oracleWaves'

                });

                this.assetsOracleTmp = this.oracleWaves;

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

                this.observe('oracleWaves', () => {
                    ds.config.set('oracleWaves', this.oracleWaves);
                    this.assetsOracleTmp = this.oracleWaves;
                });

                this.observe('assetsOracleTmp', () => {
                    const address = this.assetsOracleTmp;
                    this.oraclePending = true;
                    ds.api.data.getOracleData(address)
                        .then(data => {
                            if (data.oracle) {
                                this.oracleWavesData = data.oracle;
                                ds.config.set('oracleWaves', address);
                                this.oracleWaves = this.assetsOracleTmp;
                                this.oracleError = false;
                                this.oracleSuccess = true;
                                setTimeout(() => {
                                    this.oracleSuccess = false;
                                    $scope.$apply();
                                }, 1500);
                            }
                        })
                        .catch(() => {
                            this.oracleError = true;
                        })
                        .then(() => {
                            this.oraclePending = false;
                            $scope.$apply();
                        });
                });

                // this.observe('candle', () => {
                //     user.changeCandle(this.candle);
                // });

                this.observe('dontShowSpam', () => {
                    const dontShowSpam = this.dontShowSpam;
                    user.setSetting('dontShowSpam', dontShowSpam);
                });

                this.observe('scamListUrl', () => {
                    ds.config.setConfig({
                        scamListUrl: this.scamListUrl
                    });
                    waves.node.assets.stopScam();
                });

                this.observe('tokensNameListUrl', () => {
                    ds.config.setConfig({
                        tokensNameListUrl: this.tokensNameListUrl
                    });
                    waves.node.assets.tokensNameList();
                });

                this.observe(['node', 'matcher', 'api'], () => {
                    ds.config.setConfig({
                        node: this.node,
                        matcher: this.matcher,
                        api: this.api
                    });
                });

                this.observe('shownSeed', () => {
                    // analytics.push('Settings', `Settings.ShowSeed.${WavesApp.type}`);
                });

                this.observe('shownKey', () => {
                    // analytics.push('Settings', `Settings.ShowKeyPair.${WavesApp.type}`);
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
                // analytics.push('Settings', `Settings.ChangeLanguage.${WavesApp.type}`, language);
            }

            setNetworkDefault() {
                this.node = WavesApp.network.node;
                this.matcher = WavesApp.network.matcher;
                this.dontShowSpam = true;
                this.scamListUrl = WavesApp.network.scamListUrl;
                this.tokensNameListUrl = WavesApp.network.tokensNameListUrl;
                this.oracleWaves = WavesApp.oracles.waves;
                this.api = WavesApp.network.api;
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

            showScriptModal() {
                modalManager.showScriptModal();
            }

            showPasswordModal() {
                modalManager.showPasswordModal();
            }

            showDeleteAccountModal() {
                modalManager.showDeleteAccountModal();
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
