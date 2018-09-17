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
     * @return {GatewaySignCtrl}
     */
    const controller = function (Base, $scope, user, utils) {

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
            hasError = false;
            /**
             * @type {string}
             */
            imageSrc = '';
            /**
             * @type {string}
             */
            successPath = '';
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
            _successUrl = '';
            /**
             * @readonly
             * @type {boolean}
             */
            debug = false;
            /**
             * @type {string}
             */
            titleLiteral = LOCALIZATION.title.normal;

            /**
             * @param {object} search
             * @param {string} search.n Gateaway application name
             * @param {string} search.r Gateaway referrer
             * @param {string} search.i Gateaway icon path
             * @param {string} search.d Gateaway data for sign
             * @param {string} search.s Gateaway path for success auth
             * @param {string} search.debug Gateaway show errors
             */
            constructor(search) {
                super($scope);

                this.debug = !!search.debug;

                this.observe('hasError', (value) => {
                    if (value) {
                        this.titleLiteral = LOCALIZATION.title.error;
                    } else {
                        this.titleLiteral = LOCALIZATION.title.normal;
                    }
                });

                const adapter = ds.signature.getSignatureApi();

                schema.parse(search)
                    .then((params) => {
                        const { referrer, name, data, iconPath, successPath } = params;
                        const prefix = 'WavesWalletAuthentication';
                        const host = GatewaySignCtrl._getDomain(referrer);

                        const signable = adapter.makeSignable({
                            type: SIGN_TYPE.AUTH,
                            data: { prefix, host, data }
                        });

                        this.referrer = referrer;
                        this.name = name;

                        this._setImageUrl(referrer, iconPath);

                        return Promise.all([
                            signable.getSignature(),
                            adapter.getPublicKey()
                        ])
                            .then(([signature, publicKey]) => {
                                const search = `?s=${signature}&p=${publicKey}&a=${user.address}&d=${data}`;
                                const path = successPath || '';
                                const url = `${referrer}/${path}${search}`;
                                this._successUrl = GatewaySignCtrl._normalizeUrl(url);
                            });
                    })
                    .catch((e) => {
                        this._sendError(e.message || e);
                    });
            }

            send() {
                utils.redirect(this._successUrl);
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

    controller.$inject = ['Base', '$scope', 'user', 'utils'];

    angular.module('app.utils').controller('GatewaySignCtrl', controller);
})();
