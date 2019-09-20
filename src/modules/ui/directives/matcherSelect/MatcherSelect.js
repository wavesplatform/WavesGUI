(function () {
    'use strict';

    /**
     * @param Base
     * @returns {MatcherSelect}
     */
    const controller = function (Base, i18n) {

        const { libs } = require('@waves/waves-transactions');

        const MATCHER_LIST = [
            {
                url: 'https://matcher.wavesplatform.com/matcher',
                name: 'SUPER LEGAL MATCHER',
                terms: 'This agreement is between you (referenced herein as “you” or with “your”) and SuperDEX.' +
                    ' By accessing, using or clicking “I agree” to any of the services made available by SuperDEX ' +
                    'or one of its affiliates through the website (superdex.com), the API (matcher.superdex.com), ' +
                    'our mobile applications, or any other related services provided by Binance or its affiliates as ' +
                    'further described in Section 4 below (collectively, the “Services”) you agree that you have' +
                    ' read, understood and accepted all of the terms and conditions contained in this Terms of Use' +
                    ' agreement (the or these “Terms”), as well as our Privacy Policy found at' +
                    '  superdex.com/en/privacy.  Additionally, when using certain features of the Services, you may' +
                    ' be subject to additional terms and conditions applicable to such features.'
            },
            {
                url: 'https://matcher.123.com/matcher',
                name: 'SUPER ILLEGAL MATCHER',
                terms: 'Some text'
            }
        ];

        class MatcherSelect extends Base {

            /**
             * @public
             */
            matcherList = [];

            constructor() {
                super();

                this._addVolume();

                this.matcherList = MATCHER_LIST.concat({
                    custom: true,
                    name: i18n.translate('modal.matcherChoice.customMatcher', 'app.utils')
                });

                this.observe('active', () => {
                    this.onChange({ matcher: this.active });
                });
            }

            _addVolume() {
                // const matcherListHash = utils.toHash(this.matcherList, 'url');
                MATCHER_LIST.forEach(({ url }) => {
                    ds.fetch(url)
                    // TODO вынести в utils
                        .then(matcherPublicKey => {
                            if (matcherPublicKey) {
                                const matcherPublicKeyBytes = libs.crypto.base58Decode(matcherPublicKey);
                                return libs.crypto.address(
                                    {
                                        publicKey: matcherPublicKeyBytes
                                    },
                                    ds.config.get('code'));
                            }
                        })
                        .then(matcherAddress => {
                            ds.api.pairs.get(WavesApp.defaultAssets.WAVES, WavesApp.defaultAssets.BTC)
                                .then(pair => {
                                    ds.api.pairs.info(matcherAddress, [pair])
                                        .then(infoList => {
                                            // matcherListHash[url].wavesBtcVolume = infoList.volume;
                                            // this.matcherList = Object.values(matcherListHash);
                                            this.matcherList
                                                .find(matcher => matcher.url === url)
                                                .wavesBtcVolume = infoList[0].volume;
                                        });
                                });
                        });
                });
            }

        }

        return new MatcherSelect();
    };

    controller.$inject = ['Base', 'i18n'];

    angular.module('app.ui').component('wMatcherSelect', {
        bindings: {
            onChange: '&'
        },
        templateUrl: 'modules/ui/directives/matcherSelect/matcherSelect.html',
        transclude: false,
        controller
    });
})();
