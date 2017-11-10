(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param {app.utils} utils
     * @param {app.utils.decorators} decorators
     * @param $templateRequest
     * @param $rootScope
     * @return {ModalManager}
     */
    const factory = function ($mdDialog, utils, decorators, $templateRequest, $rootScope) {


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


        class ModalManager {

            constructor() {
                this.openModal = new tsUtils.Signal();
                this._counter = 0;

                $rootScope.$on('$stateChangeStart', () => {
                    const counter = this._counter;

                    for (let i = 0; i < counter; i++) {
                        $mdDialog.cancel();
                    }
                });
            }

            showAssetInfo(asset) {
                return this._getModal({
                    ns: 'app.utils',
                    title: 'modal.assetInfo.title',
                    contentUrl: 'modules/utils/modals/assetInfo/assetInfo.html',
                    locals: asset,
                    controller: 'AssetInfoCtrl'
                });
            }

            /**
             * @param {User} user
             */
            showTermsAccept(user) {
                return this._getModal({
                    templateUrl: 'modules/utils/modals/termsAccept/terms-accept.html',
                    controller: 'TermsAcceptCtrl',
                    clickOutsideToClose: false,
                    escapeToClose: false
                })
                    .then(() => user.setSetting('termsAccepted', true));
            }

            /**
             * @param {IModalOptions} options
             */
            showCustomModal(options) {
                return this._getModal(tsUtils.merge({}, DEFAULT_OPTIONS, options));
            }

            showAccountInfo() {
                return this._getModal({
                    controller: 'AccountInformationCtrl',
                    title: 'modal.account.title',
                    contentUrl: 'modules/utils/modals/accountInformation/account-information.modal.html',
                    mod: 'account-info'
                });
            }

            /**
             * @param {object} data
             * @param {User} data.user
             * @param {string} [data.assetId]
             * @param {boolean} [data.canChooseAsset]
             * @return {Promise}
             */
            showSendAsset(data) {
                return data.user.getSetting('baseAssetId')
                    .then((baseAssetId) => this._getModal({
                        controller: 'AssetSendCtrl',
                        titleContentUrl: 'modules/utils/modals/sendAsset/send-title.modal.html',
                        contentUrl: 'modules/utils/modals/sendAsset/send.modal.html',
                        mod: 'modal-send',
                        locals: { assetId: data.assetId, baseAssetId, canChooseAsset: data.canChooseAsset }
                    }));
            }

            /**
             * @param {User} user
             * @return {Promise}
             */
            showReceiveAsset(user) {
                return user.onLogin()
                    .then(() => {
                        return this._getModal({
                            locals: user.address,
                            title: 'modal.receive.title',
                            contentUrl: 'modules/utils/modals/receiveAsset/receive.modal.html',
                            controller: 'AssetReceiveCtrl',
                            mod: 'modal-receive'
                        });
                    });
            }

            /**
             * @return {Promise}
             */
            getSeed() {
                return this._getModal({
                    templateUrl: 'modules/utils/modals/enterPassword/enterPassword.modal.html',
                    controller: 'EnterPasswordCtrl'
                });
            }

            /**
             * @param {IModalOptions} options
             * @private
             */
            _getModal(options) {
                const target = tsUtils.merge(Object.create(null), DEFAULT_OPTIONS, options);
                if (target.locals) {
                    target.bindToController = true;
                }

                return ModalManager._getTemplate(target)
                    .then((template) => {
                        const { controller, controllerAs } = ModalManager._getController(options);
                        const changeCounter = () => {
                            this._counter--;
                        };

                        target.controller = controller;
                        target.controllerAs = controllerAs;
                        target.template = template;

                        this._counter++;
                        const modal = $mdDialog.show(target);

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
                    const title = `<div class="headline-1" params='${params}' w-i18n="${options.title}"></div>`;
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
                return `<md-dialog ${namespace} ${classes} aria-label="modal" >${content}</md-dialog>`;
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

        return new ModalManager();
    };

    factory.$inject = ['$mdDialog', 'utils', 'decorators', '$templateRequest', '$rootScope'];

    angular.module('app.utils')
        .factory('modalManager', factory);
})();

/**
 * @typedef {object} IModalOptions
 * @property {string} [ns]
 * @property {string} [mod]
 * @property {string} [template]
 * @property {string} [templateUrl]
 * @property {string} [title]
 * @property {string} [titleParams]
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
