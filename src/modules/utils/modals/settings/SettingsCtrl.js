(function () {
    'use strict';

    const ds = require('data-service');
    const { libs } = require('@waves/waves-transactions');
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

            allowParing = true;
            encodedSeed = '';
            shownEncodedSeed = false;
            oracleWaves = '';
            tab = 'general';
            address = user.address;
            publicKey = user.publicKey;
            id = user.id;
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
                    logoutAfterMin: 'logoutAfterMin',
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

                this.observe('shownSeed', () => {
                    // analytics.push('Settings', `Settings.ShowSeed.${WavesApp.type}`);
                });

                this.observe('shownKey', () => {
                    // analytics.push('Settings', `Settings.ShowKeyPair.${WavesApp.type}`);
                });

                const catchProcessor = method => {
                    try {
                        return method().catch(() => null);
                    } catch (e) {
                        return Promise.resolve(null);
                    }
                };

                const api = ds.signature.getSignatureApi();

                Promise.all([
                    catchProcessor(() => api.getSeed()),
                    catchProcessor(() => api.getPrivateKey()),
                    catchProcessor(() => api.getPublicKey()),
                    catchProcessor(() => api.getEncodedSeed())
                ]).then(([seed, privateKey, publicKey, encodedSeed]) => {

                    let canSeed = encodedSeed && seed && typeof seed === 'string';

                    try {
                        canSeed = canSeed && libs.crypto.stringToBytes(seed)
                            .join(',') === libs.crypto.base58Decode(encodedSeed).join(',');
                    } catch (e) {
                        canSeed = false;
                    }

                    this.phrase = canSeed ? seed : null;
                    this.encodedSeed = encodedSeed;
                    this.privateKey = privateKey;
                    this.publicKey = publicKey;
                    this.allowParing = canSeed;
                    $scope.$digest();
                });
            }

            onChangeLanguage(language) {
                // analytics.push('Settings', `Settings.ChangeLanguage.${WavesApp.type}`, language);
            }

            showExportAccountModal() {
                return modalManager.showExportAccount();
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

            showPasswordModal() {
                modalManager.showPasswordModal();
            }

            showDeleteAccountModal() {
                modalManager.showDeleteAccountModal();
            }

            onBlurSetting(prop) {
                this[prop] = this[prop] ? this[prop] : undefined;
            }

        }

        return new SettingsCtrl();
    };

    controller.$inject = [
        'Base',
        '$scope',
        'waves',
        'user',
        '$templateRequest',
        'utils',
        'storage',
        'modalManager'
    ];

    angular.module('app.utils').controller('SettingsCtrl', controller);

})();
