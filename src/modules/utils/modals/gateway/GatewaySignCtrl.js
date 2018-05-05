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

                this.hasError = false;
                /**
                 * @type {string}
                 */
                this.imageSrc = '';
                /**
                 * @type {string}
                 */
                this.successPath = '';
                /**
                 * @type {string}
                 */
                this.referrer = '';
                /**
                 * @type {string}
                 */
                this.name = '';
                /**
                 * @type {string}
                 * @private
                 */
                this._successUrl = '';
                /**
                 * @type {boolean}
                 */
                this.debug = !!search.debug;
                /**
                 * @type {string}
                 */
                this.titleLiteral = LOCALIZATION.title.normal;

                this.observe('hasError', (value) => {
                    if (value) {
                        this.titleLiteral = LOCALIZATION.title.error;
                    } else {
                        this.titleLiteral = LOCALIZATION.title.normal;
                    }
                });

                schema.parse(search)
                    .then((data) => {
                        return user.getSeed().then((seed) => ({ seed, data }));
                    })
                    .then((params) => {
                        const seed = params.seed;
                        const search = params.data;
                        const { referrer, name, data, iconPath, successPath } = search;

                        this.referrer = referrer;
                        this.name = name;

                        this._setImageUrl(referrer, iconPath);
                        /**
                         * @type {ITransactionClass}
                         */
                        const Sign = Waves.Transactions.createSignableData([
                            new Waves.byteProcessors.StringWithLength('prefix'),
                            new Waves.byteProcessors.StringWithLength('host'),
                            new Waves.byteProcessors.StringWithLength('data')
                        ]);

                        const prefix = 'WavesWalletAuthentication';
                        const host = GatewaySignCtrl._getDomain(referrer);

                        return new Sign({ prefix, host, data })
                            .prepareForAPI(seed.keyPair.privateKey)
                            .then(({ signature }) => {
                                const publicKey = seed.keyPair.publicKey;
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
                location.href = this._successUrl;
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
