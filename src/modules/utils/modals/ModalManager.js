(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param {app.utils} utils
     * @param {app.utils.decorators} decorators
     * @param $templateRequest
     * @param $rootScope
     * @param {$injector} $injector
     * @param {State} state
     * @param {Storage} storage
     * @param {User} user
     * @return {ModalManager}
     */
    const factory = function ($mdDialog, utils, decorators, $templateRequest, $rootScope, $injector, state, storage,
                              user) {

        const tsUtils = require('ts-utils');
        const ds = require('data-service');
        const { Money } = require('@waves/data-entities');
        const { SIGN_TYPE } = require('@waves/signature-adapter');
        const analytics = require('@waves/event-sender');

        const DEFAULT_OPTIONS = {
            clickOutsideToClose: true,
            escapeToClose: true,
            autoWrap: false,
            multiple: true,
            skipHide: true,
            controllerAs: '$ctrl',
            ns: 'app.utils'
        };

        const DEFAULT_TEMPLATES_URLS = {
            HEADER: 'modules/utils/modals/templates/header.modal.html'
        };

        /**
         * @class ModalManager
         */
        class ModalManager {

            constructor() {
                /**
                 * @type {Signal<Promise>}
                 */
                this.openModal = new tsUtils.Signal();
                /**
                 * @type {number}
                 * @private
                 */
                this._counter = 0;

                state.signals.changeRouterStateStart.on(this.closeModals, this);
                user.logoutSignal.on(this.closeModals, this);
            }

            showScriptModal() {
                return this._getModal({
                    id: 'script-modal',
                    contentUrl: 'modules/utils/modals/script/script.html',
                    controller: 'ScriptModalCtrl',
                    title: 'modal.script.setScript'
                });
            }

            showPasswordModal() {
                return this._getModal({
                    id: 'password-modal',
                    contentUrl: 'modules/utils/modals/password/password.html',
                    controller: 'PasswordModalCtrl',
                    title: 'modal.settings.changePass'
                });
            }

            showForgotPasswordModal() {
                return this._getModal({
                    id: 'forgot-password-modal',
                    contentUrl: 'modules/utils/modals/forgot-password/forgot-password.html',
                    controller: 'ForgotPasswordModalCtrl'
                });
            }

            showDeleteAccountModal() {
                return this._getModal({
                    id: 'delete-account-modal',
                    contentUrl: 'modules/utils/modals/delete-account/delete-account.html',
                    controller: 'DeleteAccountModalCtrl'
                });
            }

            showTryDesktopModal() {
                analytics.send({ name: 'Onboarding Platform Popup Show', target: 'ui' });
                return this._getModal({
                    id: 'try-desktop',
                    title: '',
                    contentUrl: 'modules/utils/modals/tryDesktop/tryDesktop.html',
                    controller: 'TryDesktopCtrl',
                    clickOutsideToClose: false,
                    escapeToClose: false,
                    mod: 'try-desktop-modal'
                });
            }

            showPairingWithMobile() {
                return this._getModal({
                    id: 'pairing-with-mobile',
                    title: '',
                    contentUrl: 'modules/utils/modals/pairingWithMobile/pairingWithMobile.html',
                    controller: 'PairingWithMobileCtrl',
                    mod: 'pairing-with-mobile'
                });
            }

            /**
             * @param {Signable} signable
             * @return {Promise<Signable>}
             */
            showSignByDevice(signable) {
                return this._getModal({
                    id: 'sign-by-device',
                    contentUrl: 'modules/utils/modals/signByDevice/signByDevice.html',
                    controller: 'SignByDeviceCtrl',
                    locals: { signable },
                    clickOutsideToClose: false,
                    escapeToClose: false
                });
            }

            showConfirmOrder(options) {
                return this._getModal({
                    id: 'confirm-correct-order',
                    contentUrl: 'modules/utils/modals/confirmOrder/confirmOrder.html',
                    controller: 'ConfirmOrderCtrl',
                    locals: options
                });
            }

            /**
             * @param {Promise} promise
             * @param {string} type
             * @return {Promise}
             */
            showLoginByDevice(promise, type) {
                return this._getModal({
                    id: 'login-by-device',
                    contentUrl: 'modules/utils/modals/loginByDevice/loginByDevice.html',
                    controller: 'LoginByDeviceCtrl',
                    locals: () => ({ promise, type }),
                    clickOutsideToClose: false,
                    escapeToClose: false
                });
            }

            showSignDeviceError(locals) {
                return this._getModal({
                    id: 'error-sign-device',
                    contentUrl: 'modules/utils/modals/signDeviceError/signDeviceError.html',
                    controller: 'SignDeviceError',
                    locals: { ...locals },
                    clickOutsideToClose: false,
                    escapeToClose: false
                });
            }

            showGatewaySign(search) {
                return this._getModal({
                    id: 'gateway-sign-in',
                    title: '{{$ctrl.titleLiteral}}',
                    contentUrl: 'modules/utils/modals/gateway/gatewaySign.html',
                    controller: 'GatewaySignCtrl',
                    locals: { search },
                    clickOutsideToClose: false,
                    escapeToClose: false
                });
            }

            showPinAsset() {
                return this._getModal({
                    id: 'pin-asset',
                    title: 'modal.pinAsset.title',
                    templateUrl: 'modules/utils/modals/pinAsset/pinAsset.html',
                    controller: 'PinAssetCtrl',
                    mod: 'pin-asset-modal'
                });
            }

            showAssetInfo(asset) {
                return this._getModal({
                    id: 'asset-info',
                    title: 'modal.assetInfo.title',
                    contentUrl: 'modules/utils/modals/assetInfo/assetInfo.html',
                    locals: asset,
                    controller: 'AssetInfoCtrl',
                    mod: 'm-dialog m-dialog_asset-info'
                });
            }

            showSettings() {
                return this._getModal({
                    id: 'user-settings',
                    ns: 'app.utils',
                    title: 'modal.settings.title',
                    contentUrl: 'modules/utils/modals/settings/settings.html',
                    controller: 'SettingsCtrl',
                    mod: 'settings-modal'
                });
            }

            showTermsAccept() {
                /**
                 * @type {User}
                 */
                const user = $injector.get('user');

                analytics.send({
                    name: 'Create Done Show', params: { hasBackup: user.getSetting('hasBackup') }
                });

                return this._getModal({
                    id: 'terms-accept',
                    templateUrl: 'modules/utils/modals/termsAccept/terms-accept.html',
                    controller: 'TermsAcceptCtrl',
                    clickOutsideToClose: false,
                    escapeToClose: false
                })
                    .then(() => {
                        analytics.send({ name: 'Create Done Confirm and Begin Click' });
                        storage.save('needReadNewTerms', false);
                        storage.save('termsAccepted', true);
                    });
            }

            showAcceptNewTerms() {
                return this._getModal({
                    id: 'accept-new-terms',
                    templateUrl: 'modules/utils/modals/acceptNewTerms/accept-new-terms.html',
                    controller: 'AcceptNewTermsCtrl',
                    clickOutsideToClose: false,
                    escapeToClose: false
                })
                    .then(() => {
                        storage.save('needReadNewTerms', false);
                        storage.save('termsAccepted', true);
                    });
            }

            showTutorialModals() {
                return this._getModal({
                    id: 'tutorial-modals',
                    templateUrl: 'modules/utils/modals/tutorialModals/tutorialModals.html',
                    controller: 'TutorialModalsCtrl'
                });
            }

            showSeedBackupModal() {
                const api = ds.signature.getSignatureApi();

                return api.getSeed()
                    .then((phrase) => {
                        const seed = new ds.Seed(phrase, window.WavesApp.network.code);
                        return this._getModal({
                            id: 'seed-backup',
                            title: 'modal.backup.title.{{$ctrl.titleLiteral}}',
                            contentUrl: 'modules/utils/modals/seedBackup/seedBackupModals.html',
                            controller: 'SeedBackupModalsCtrl',
                            locals: { seed }
                        });
                    });
            }

            showConfirmDeleteUser(user) {
                return this._getModal({
                    id: 'delete-user-confirm',
                    templateUrl: 'modules/utils/modals/confirmDeleteUser/confirmDeleteUser.modal.html',
                    controller: 'confirmDeleteUserCtrl',
                    locals: {
                        user
                    }
                });
            }

            showDexScriptedPair(assets) {
                return this._getModal({
                    id: 'dex-scripted-pair',
                    templateUrl: 'modules/utils/modals/dexScriptedPair/dexScriptedPair.html',
                    controller: 'DexScriptedPairCtrl',
                    locals: {
                        assets
                    }
                });
            }

            showAccountChangeName() {
                return this._getModal({
                    id: 'changeName',
                    templateUrl: 'modules/utils/modals/changeName/changeName.html',
                    controller: 'ChangeNameCtrl'
                });
            }

            showAccountAddress() {
                return this._getModal({
                    id: 'addressInfo',
                    templateUrl: 'modules/utils/modals/addressInfo/addressInfo.html',
                    controller: 'AddressInfoCtrl'
                });
            }

            showAccountInfo() {
                /**
                 * @type {User}
                 */
                const user = $injector.get('user');
                return this._getModal({
                    id: 'account-info',
                    controller: 'AccountInfoCtrl',
                    title: 'modal.account.title',
                    titleParams: {
                        name: user.name || $injector.get('i18n')
                            .translate('modal.account.title_default_name', 'app.utils')
                    },
                    contentUrl: 'modules/utils/modals/accountInfo/account-info.modal.html',
                    mod: 'account-info'
                });
            }

            /**
             * @param {object} [data]
             * @param {string} [data.assetId]
             * @param {'singleSend'|'massSend'} [data.mode]
             * @param {string} [data.amount]
             * @param {string} [data.recipient]
             * @param {boolean} [data.strict]
             * @param {string} [data.referrer]
             * @return {Promise}
             */
            showSendAsset(data) {
                data = data || Object.create(null);

                return this._getModal({
                    id: 'send-asset',
                    controller: 'AssetSendCtrl',
                    templateUrl: 'modules/utils/modals/sendAsset/send.modal.html',
                    mod: 'modal-send',
                    locals: {
                        assetId: data.assetId,
                        canChooseAsset: !data.assetId,
                        mode: data.mode,
                        amount: data.amount,
                        recipient: data.recipient,
                        strict: data.strict,
                        referrer: data.referrer,
                        attachment: data.attachment
                    }
                });
            }

            /**
             * @param {Asset} [asset]
             * @return {Promise}
             */
            showReceiveModal(asset) {
                return this._getModal({
                    id: 'receive-popup',
                    locals: { asset },
                    templateUrl: 'modules/utils/modals/receive/Receive.html',
                    controller: 'ReceiveCtrl'
                });
            }

            /**
             * @param {User} user
             * @param {Asset} asset
             * @return {Promise}
             */
            showDepositAsset(user, asset) {
                return this._getModal({
                    id: 'deposit-asset',
                    locals: { address: user.address, asset },
                    title: 'modal.deposit.title',
                    titleParams: { assetName: asset.name },
                    contentUrl: 'modules/utils/modals/depositAsset/deposit-asset.modal.html',
                    controller: 'DepositAsset',
                    mod: 'modal-deposit-asset'
                });
            }

            /**
             * @param {User} user
             * @param {Asset} asset
             * @return {Promise}
             */
            showSepaAsset(user, asset) {
                return this._getModal({
                    id: 'sepa-asset',
                    locals: { address: user.address, asset },
                    title: 'modal.sepa.title',
                    titleParams: { assetName: asset.name },
                    contentUrl: 'modules/utils/modals/sepaAsset/sepa-asset.modal.html',
                    controller: 'SepaAsset',
                    mod: 'modal-sepa-asset'
                });
            }

            showTransactionInfo(transactionId) {
                return this._getModal({
                    id: 'transaction-info',
                    ns: 'app.ui',
                    controller: 'TransactionInfoCtrl',
                    templateUrl: 'modules/utils/modals/transactionInfo/transaction-info.modal.html',
                    mod: 'transaction-info',
                    locals: { transactionId }
                });
            }

            showAnyTx(tx, analyticsText) {
                return this._getModal({
                    id: 'any-tx-modal',
                    controller: 'AnyTxModalCtrl',
                    contentUrl: 'modules/utils/modals/anyTxModal/any-tx-modal.html',
                    title: 'modals.anyTx.title',
                    locals: { tx, analyticsText }
                });
            }

            showStartLeasing() {
                return this._getModal({
                    id: 'start-leasing',
                    ns: 'app.utils',
                    controller: 'StartLeasingCtrl',
                    titleContent: '{{$ctrl.title}}',
                    mod: 'start-leasing',
                    contentUrl: 'modules/utils/modals/startLeasing/startLeasing.html'
                });
            }

            showConfirmTx(signable, analyticsText) {
                return this._getModal({
                    id: 'confirm-tx',
                    mod: 'confirm-tx',
                    ns: 'app.ui',
                    locals: { signable, analyticsText },
                    controller: 'ConfirmTxCtrl',
                    contentUrl: 'modules/utils/modals/confirmTx/confirmTx.modal.html'
                });
            }

            showBurnModal(assetId) {
                return $injector.get('waves').node.assets.balance(assetId).then(({ available }) => this._getModal({
                    id: 'token-burn',
                    mod: 'change-token',
                    locals: { money: available, txType: 'burn' },
                    titleContent: '<span w-i18n="modal.token.burn.title" params="{name: $ctrl.asset.name}"></span>',
                    contentUrl: 'modules/utils/modals/changeToken/change-token-modal.html',
                    controller: 'TokenChangeModalCtrl'
                }));
            }

            showReissueModal(assetId) {
                return $injector.get('waves').node.assets.balance(assetId).then(({ available }) => this._getModal({
                    id: 'token-burn',
                    mod: 'change-token',
                    locals: { money: available, txType: 'reissue' },
                    titleContent: '<span w-i18n="modal.token.reissue.title" params="{name: $ctrl.asset.name}"></span>',
                    contentUrl: 'modules/utils/modals/changeToken/change-token-modal.html',
                    controller: 'TokenChangeModalCtrl'
                }));
            }

            showSponsorshipModal(assetId, isEdit) {
                const title = isEdit ? 'modal.sponsorship_edit.title' : 'modal.sponsorship.title';
                return ds.api.assets.get(assetId).then((asset) => {
                    return this._getModal({
                        id: 'sponsorship',
                        mod: 'sponsorship',
                        locals: { asset, assetId, isCreateSponsored: !isEdit },
                        titleContent: `<span w-i18n="${title}"></span>`,
                        controller: 'SponsoredModalCtrl',
                        contentUrl: 'modules/utils/modals/sponsored/sponsored.html'
                    });
                });
            }

            showSetAssetScriptModal(assetId) {
                const title = 'modal.setAssetScript.title';
                return this._getModal({
                    id: 'setAssetScript',
                    mod: 'setAssetScript',
                    locals: assetId,
                    titleContent: `<span w-i18n="${title}"></span>`,
                    controller: 'SetAssetScriptModalCtrl',
                    contentUrl: 'modules/utils/modals/setAssetScript/setAssetScript.html'
                });
            }

            showSponsorshipStopModal(assetId) {
                const waves = $injector.get('waves');

                return Promise.all([
                    ds.api.assets.get(assetId),
                    waves.node.getFee({ type: SIGN_TYPE.SPONSORSHIP })
                ]).then(([asset, fee]) => {
                    const money = new Money(0, asset);
                    const tx = waves.node.transactions.createTransaction({
                        type: SIGN_TYPE.SPONSORSHIP,
                        assetId,
                        asset,
                        minSponsoredAssetFee: money,
                        fee
                    });
                    const signable = ds.signature.getSignatureApi().makeSignable({
                        type: tx.type,
                        data: tx
                    });

                    return this.showConfirmTx(signable);
                });
            }

            showImportAccountsModal() {
                return this._getModal({
                    id: 'import-accounts',
                    mod: 'import-accounts',
                    controller: 'ImportAccountsCtrl',
                    contentUrl: 'modules/utils/modals/importAccounts/importAccounts.html'
                });
            }

            showConfirmLogout() {
                return this._getModal({
                    id: 'logout-modal',
                    contentUrl: 'modules/utils/modals/confirmLogout/confirmLogout.modal.html',
                    title: ''
                });
            }

            showLockPairWarning(amountTicker, priceTicker) {
                return this._getModal({
                    id: 'logout-modal',
                    controller: 'LockPairWarningCtrl',
                    contentUrl: 'modules/utils/modals/lockPairWarning/lockPairWarning.modal.html',
                    locals: { amountTicker, priceTicker }
                });
            }

            /**
             * @param {IDialogOptions} options
             * @return {Promise}
             */
            showDialogModal(options) {
                const contentUrl = 'modules/utils/modals/templates/dialog-content.html';

                const ns = options.ns || DEFAULT_OPTIONS.ns;
                options.message.ns = options.message.ns || ns;
                options.buttons.forEach((button) => {
                    button.text.ns = button.text.ns || ns;
                });

                const controller = function ($scope, $mdDialog) {
                    Object.assign($scope, options);
                    this.applyClick = (button) => {
                        const method = button.success ? 'hide' : 'cancel';
                        if (button.click) {
                            button.click();
                        }
                        $mdDialog[method](button.data);
                    };
                };

                controller.$inject = ['$scope', '$mdDialog'];

                return this._getModal(tsUtils.merge({}, DEFAULT_OPTIONS, options, { contentUrl, controller }));
            }

            /**
             * @param {IModalOptions} options
             * @return {$q.resolve}
             */
            showCustomModal(options) {
                return this._getModal(tsUtils.merge({}, DEFAULT_OPTIONS, options));
            }

            closeModals() {
                const counter = this._counter;

                for (let i = 0; i < counter; i++) {
                    $mdDialog.cancel();
                }
            }

            /**
             * @return {User}
             * @private
             */
            _getUser() {
                return $injector.get('user');
            }

            /**
             * @param {IModalOptions} options
             * @private
             */
            _getModal(options) {
                const target = { ...DEFAULT_OPTIONS, ...options };

                if (target.locals) {
                    target.bindToController = true;
                }

                return ModalManager._getTemplate(target)
                    .then((template) => {
                        const { controller, controllerAs } = ModalManager._getController(options);
                        const changeCounter = () => {
                            this._counter--;

                            if (options.id) {
                                // analytics.push('Modal', `Modal.Close.${WavesApp.type}`, options.id);
                            }
                        };

                        target.controller = controller;
                        target.controllerAs = controllerAs;
                        target.template = template;

                        this._counter++;
                        const modal = $mdDialog.show(target);

                        if (options.id) {
                            // analytics.push('Modal', `Modal.Open.${WavesApp.type}`, options.id);
                        }

                        modal.then(changeCounter, changeCounter);

                        this.openModal.dispatch(modal);
                        return modal;
                    });
            }

            /**
             * @param {IModalOptions} options
             * @return {Promise<string>}
             * @private
             */
            static _getTemplate(options) {
                if (options.template) {
                    return Promise.resolve(options.template);
                }
                if (options.templateUrl) {
                    return ModalManager._loadTemplate(options.templateUrl);
                }

                return ModalManager._createTemplate(options);
            }

            /**
             * @param {IModalOptions} options
             * @private
             */
            static _getController(options) {
                if (!options.controller) {
                    return { controller: ModalManager._wrapController((() => ({}))), controllerAs: null };
                }

                let controller = null;
                let controllerAs;

                if (typeof options.controller === 'function') {
                    controller = ModalManager._wrapController(options.controller);
                } else {
                    const parts = options.controller.split(' as ');
                    controller = ModalManager._wrapController(WavesApp.getController(parts[0]));
                    controllerAs = parts[1];
                }

                if (!controllerAs) {
                    controllerAs = DEFAULT_OPTIONS.controllerAs;
                }

                return { controller, controllerAs };
            }

            static _wrapController(controller) {

                const $ctrl = function ($element, $mdDialog, ...args) {

                    $element.on('click', '[w-modal-close]', () => {
                        $mdDialog.cancel();
                    });

                    $element.on('click', '[w-modal-hide]', () => {
                        $mdDialog.hide();
                    });

                    /**
                     * Call controller with this of proxy controller
                     */
                    return controller.call(this, ...args);
                };
                $ctrl.$inject = ['$element', '$mdDialog', ...(controller.$inject || [])];

                return $ctrl;
            }

            /**
             * @param {IModalOptions} options
             * @return {Promise<string>}
             * @private
             */
            static _createTemplate(options) {
                return Promise.all([
                    ModalManager._getHeader(options)
                        .then(ModalManager._wrapTemplate('md-toolbar')),
                    ModalManager._getContent(options)
                        .then(ModalManager._wrapTemplate('md-dialog-content')),
                    ModalManager._getFooter(options)
                ])
                    .then((templateParts) => {
                        const { mod, ns } = options;
                        const content = templateParts.filter(Boolean)
                            .join('');
                        return ModalManager._getWrapTemplate({ ns, mod, content });
                    });
            }

            /**
             * @param {IModalOptions} options
             * @return {Promise<string>}
             * @private
             */
            static _getHeader(options) {
                if (options.title) {
                    const params = options.titleParams ? JSON.stringify(options.titleParams) : '';
                    const title = `<div class="headline-2" params='${params}' w-i18n="${options.title}"></div>`;
                    return ModalManager._loadTemplate(DEFAULT_TEMPLATES_URLS.HEADER)
                        .then((template) => template.replace('{{title}}', title));
                } else if (options.titleContent || options.titleContentUrl) {
                    return Promise.all([
                        ModalManager._getTemplateOption(options, 'titleContent'),
                        ModalManager._loadTemplate(DEFAULT_TEMPLATES_URLS.HEADER)
                    ])
                        .then(([titleContent, header]) => header.replace('{{title}}', titleContent));
                } else {
                    return ModalManager._getTemplateOption(options, 'header');
                }
            }

            /**
             * @param {IModalOptions} options
             * @return {Promise<string>}
             * @private
             */
            static _getContent(options) {
                return ModalManager._getTemplateOption(options, 'content');
            }

            /**
             * @param {IModalOptions} options
             * @return {Promise<string>}
             * @private
             */
            static _getFooter(options) {
                return ModalManager._getTemplateOption(options, 'footer');
            }

            /**
             * @param {IModalOptions} options
             * @param {string} name
             * @return {Promise}
             * @private
             */
            static _getTemplateOption(options, name) {
                if (options[name]) {
                    return Promise.resolve(options[name]);
                } else if (options[`${name}Url`]) {
                    return ModalManager._loadTemplate(options[`${name}Url`]);
                } else {
                    return Promise.resolve(null);
                }
            }

            /**
             * @param {string} tagName
             * @return {Function}
             * @private
             */
            static _wrapTemplate(tagName) {
                return function (template) {
                    if (template) {
                        template = `<${tagName}>${template}</${tagName}>`;
                    }
                    return template;
                };
            }

            /**
             * @param {string} ns
             * @param {string} mod
             * @param {string} content
             * @return {string}
             * @private
             */
            static _getWrapTemplate({ ns, mod, content }) {
                const namespace = ns ? `w-i18n-ns="${ns}"` : '';
                const classes = mod ? `class="${mod}"` : '';
                return `<md-dialog ${namespace} ${classes} aria-label="modal">${content}</md-dialog>`;
            }

            /**
             * @param {string} url
             * @return {Promise<string>}
             * @private
             */
            static _loadTemplate(url) {
                return $templateRequest(url);
            }

        }

        return utils.bind(new ModalManager());
    };

    factory.$inject = ['$mdDialog',
        'utils',
        'decorators',
        '$templateRequest',
        '$rootScope',
        '$injector',
        'state',
        'storage',
        'user'];

    angular.module('app.utils')
        .factory('modalManager', factory);
})();

/**
 * @typedef {object} IModalOptions
 * @property {string} [id] // for analytics
 * @property {string} [ns]
 * @property {string} [mod]
 * @property {string} [template]
 * @property {string} [templateUrl]
 * @property {string} [title]
 * @property {object} [titleParams]
 * @property {string} [titleContent]
 * @property {string} [titleContentUrl]
 * @property {string} [header]
 * @property {string} [headerUrl]
 * @property {string} [content]
 * @property {string} [contentUrl]
 * @property {string} [footer]
 * @property {string} [footerUrl]
 * @property {boolean} [clickOutsideToClose]
 * @property {boolean} [escapeToClose]
 * @property {boolean} [autoWrap]
 * @property {boolean} [multiple]
 * @property {*} [locals]
 * @property {string | function} [controller]
 * @property {string} [controllerAs]
 */

/**
 * @typedef {object} IDialogOptions
 * @property {string} [ns]
 * @property {string} iconClass
 * @property {IMessage} message
 * @property {IDialogButton[]} buttons
 * @property {boolean} [clickOutsideToClose]
 * @property {boolean} [escapeToClose]
 */

/**
 * @typedef {object} IMessage
 * @property {string} [ns]
 * @property {string} literal
 * @property {object} [params]
 */

/**
 * @typedef {object} IDialogButton
 * @property {boolean} success
 * @property {IMessage} text
 * @property {string} classes
 * @property {function} [click]
 */
