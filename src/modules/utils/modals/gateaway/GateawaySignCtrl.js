(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @param {app.utils} utils
     * @return {GateawaySignCtrl}
     */
    const controller = function (Base, $scope, user, utils) {

        class GateawaySignCtrl extends Base {

            /**
             * @param {object} search
             * @param {string} search.n Gateaway application name
             * @param {string} search.r Gateaway referrer
             * @param {string} search.i Gateaway icon path
             * @param {string} search.d Gateaway data for sign
             * @param {string} search.s Gateaway path for success auth
             * @param {string} search.e Gateaway path for error auth
             */
            constructor(search) {
                super($scope);
                this.appName = search.n;
                this.referrer = search.r;
                this.iconPath = search.i;
                this.data = search.d;
                this.successPath = search.s;
                this.errorPath = search.e;
                this.hasIcon = false;
                this.noReferer = false;

                this._checkParams();

                if (this.iconPath) {
                    utils.loadImage(this.iconPath)
                        .catch(() => {
                            return utils.loadImage(GateawaySignCtrl._normalizeUrl(`${this.referrer}/${this.iconPath}`));
                        })
                        .then(() => {
                            this.hasIcon = true;
                        })
                        .catch(() => {
                            this.hasIcon = false;
                        });
                }
            }

            cancel() {
                this._sendError('User cancel!');
            }

            send() {
                return user.getSeed()
                    .then((seed) => {
                        /**
                         * @type {ITransactionClass}
                         */
                        const Sign = Waves.Transactions.createSignableData([
                            new Waves.byteProcessors.StringWithLength('prefix'),
                            new Waves.byteProcessors.StringWithLength('host'),
                            new Waves.byteProcessors.StringWithLength('data')
                        ]);

                        const prefix = 'WavesWalletAuthentication';
                        const host = GateawaySignCtrl._getDomain(this.referrer);

                        return new Sign({ prefix, host, data: this.data })
                            .prepareForAPI(seed.keyPair.privateKey)
                            .then(({ signature }) => {
                                const search = `?s=${signature}&p=${seed.keyPair.publicKey}&a=${user.address}`;
                                const successPath = this.successPath || '';
                                const url = `${this.referrer}/${successPath}${search}`;
                                location.href = GateawaySignCtrl._normalizeUrl(url);
                            });
                    }).catch((e) => {
                        this._sendError(String(e));
                    });
            }

            /**
             * @private
             */
            _checkParams() {
                if (!this.referrer) {
                    this.noReferer = true;
                }

                if (!this.data) {
                    this._sendError('Has no data for sign!');
                }

                if (!this.appName) {
                    this._sendError('Has no app name!');
                }
            }

            /**
             * @param {string} message
             * @private
             */
            _sendError(message) {
                const errorPath = this.errorPath || '';
                const url = `${this.referrer}/${errorPath}?m=${message}`;
                location.href = GateawaySignCtrl._normalizeUrl(url);
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
             * @param {string} url
             * @return {string}
             * @private
             */
            static _normalizeUrl(url) {
                return url.replace(/\/\//g, '/');
            }

        }

        return new GateawaySignCtrl(this.search);
    };

    controller.$inject = ['Base', '$scope', 'user', 'utils'];

    angular.module('app.utils').controller('GateawaySignCtrl', controller);
})();
