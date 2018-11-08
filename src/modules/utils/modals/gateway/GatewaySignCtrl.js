(function () {
    'use strict';

    const LOCALIZATION = {
        title: {
            normal: 'modal.gatewaySign.title',
            error: 'modal.gatewaySign.error.title'
        }
    };

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @param {app.utils} utils
     * @param {$mdDialog} $mdDialog
     * @return {GatewaySignCtrl}
     */
    const controller = function (Base, $scope, user, utils, $mdDialog) {

        const isEmpty = (value) => !value;
        const tsApiValidator = require('ts-api-validator');
        const { SIGN_TYPE } = require('@waves/signature-adapter');
        const ds = require('data-service');
        const schema = new tsApiValidator.Schema({
            type: tsApiValidator.ObjectPart,
            required: true,
            content: {
                referrer: { type: tsApiValidator.StringPart, isEmpty, path: 'r', required: true },
                name: { type: tsApiValidator.StringPart, isEmpty, path: 'n', required: true },
                data: { type: tsApiValidator.StringPart, isEmpty, path: 'd', required: true },
                iconPath: { type: tsApiValidator.StringPart, path: 'i', required: false },
                successPath: { type: tsApiValidator.StringPart, path: 's', required: false },
                debug: { type: tsApiValidator.BooleanPart, required: false, defaultValue: false }
            }
        });

        class GatewaySignCtrl extends Base {

            /**
             * @type {boolean}
             */
            isSeed = false;
            /**
             * @type {boolean}
             */
            signAdapterError = false;
            /**
             * @type {boolean}
             */
            signPending = false;
            /**
             * @type {boolean}
             */
            isDesktop = WavesApp.isDesktop();
            /**
             * @type {boolean}
             */
            hasError = false;
            /**
             * @type {string}
             */
            imageSrc = '';
            /**
             * @type {string}
             */
            referrer = '';
            /**
             * @type {string}
             */
            name = '';
            /**
             * @type {string}
             * @private
             */
            successUrl = '';
            /**
             * @readonly
             * @type {boolean}
             */
            debug = false;
            /**
             * @type {Object}
             */
            search = null;
            /**
             * @type {string}
             */
            userType = null;
            /**
             * @type {string}
             */
            titleLiteral = LOCALIZATION.title.normal;

            /**
             * @param {object} search
             * @param {string} search.n Gateaway application name
             * @param {string} search.r Gateaway referrer
             * @param {string} search.i Gateaway icon path
             * @param {string} search.d Gateaway data for signable
             * @param {string} search.s Gateaway path for success auth
             * @param {string} search.debug Gateaway show errors
             */
            constructor(search) {
                super($scope);
                this.search = search;
                this.userType = user.userType;
                this.debug = !!search.debug;
                this.isSeed = user.userType === 'seed';
                this.observe('hasError', (value) => {
                    if (value) {
                        this.titleLiteral = LOCALIZATION.title.error;
                    } else {
                        this.titleLiteral = LOCALIZATION.title.normal;
                    }
                });

                schema.parse(search)
                    .then((params) => {
                        this.urlParams = params;
                        const { referrer, name, iconPath } = params;
                        this.referrer = referrer;
                        this.name = name;

                        this._setImageUrl(referrer, iconPath);

                        return this.createUrl();
                    }).catch((e) => {
                        this._sendError(e.message || e);
                        this.signPending = false;
                    }).finally(() => $scope.$apply());
            }

            sign() {
                this.createUrl()
                    .catch((e) => {
                        this._sendError(e.message || e);
                        this.signPending = false;
                    }).finally(() => $scope.$apply());
            }

            signAuth(adapter, data) {
                this.signPending = true;
                const signable = adapter.makeSignable(data);
                signable.getId().then(id => {
                    this.id = id;
                    $scope.$apply();
                });
                return signable.getSignature();
            }

            createUrl() {
                const { referrer, data, successPath } = this.urlParams;
                const prefix = 'WavesWalletAuthentication';
                const host = GatewaySignCtrl._getDomain(referrer);
                const signData = {
                    type: SIGN_TYPE.AUTH,
                    data: { prefix, host, data }
                };
                const adapter = ds.signature.getSignatureApi();
                const sign = this.signAuth(adapter, signData);

                return Promise.all([sign, adapter.getPublicKey()]).then(([signature, publicKey]) => {
                    const search = `?s=${signature}&p=${publicKey}&a=${user.address}`;
                    const path = successPath || '';
                    const url = `${referrer}/${path}${search}`;
                    this.signPending = false;
                    this.signAdapterError = false;
                    this.successUrl = GatewaySignCtrl._normalizeUrl(url);

                    if (!this.isSeed) {
                        this.send();
                        $mdDialog.cancel();
                    }

                }).catch(e => {
                    this.signPending = false;

                    if (this.isSeed) {
                        return Promise.reject(e);
                    }

                    this.signAdapterError = true;
                });
            }

            send() {
                utils.redirect(this.successUrl);
            }

            /**
             * @param {string} referrer
             * @param {string} iconPath
             * @return {null}
             * @private
             */
            _setImageUrl(referrer, iconPath) {
                if (!iconPath) {
                    return null;
                }

                const getUrl = function () {
                    try {
                        return new URL(iconPath).href;
                    } catch (e) {
                        return GatewaySignCtrl._normalizeUrl(`${referrer}/${iconPath}`);
                    }
                };

                const url = getUrl();
                utils.loadImage(url).then(() => {
                    this.imageSrc = url;
                    $scope.$digest();
                });
            }

            /**
             * @param {string} message
             * @private
             */
            _sendError(message) {
                this.hasError = true;
                this.errorMessage = message;
            }

            /**
             * @param {string} referer
             * @return {string}
             * @private
             */
            static _getDomain(referer) {
                const url = new URL(referer);
                if (url.protocol !== 'https:') {
                    throw new Error('Protocol must be "https:"');
                }
                return url.hostname;
            }

            /**
             * @param {string} urlString
             * @return {string}
             * @private
             */
            static _normalizeUrl(urlString) {
                const url = new URL(urlString);
                const protocol = `${url.protocol}//`;
                return protocol + (`${url.host}/${url.pathname}/${url.search}${url.hash}`.replace(/\/+/g, '/'))
                    .replace(/\/$/, '');
            }

        }

        return new GatewaySignCtrl(this.search);
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils', '$mdDialog'];

    angular.module('app.utils').controller('GatewaySignCtrl', controller);
})();
