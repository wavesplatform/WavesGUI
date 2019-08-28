(function () {
    'use strict';

    const analytics = require('@waves/event-sender');

    const controller = function (Base, $scope, $element, utils, storage) {

        class FooterCtrl extends Base {

            /**
             * @public
             * @type {string}
             */
            mobileAppLink;
            /**
             * @public
             * @type {string}
             */
            telegramLink;
            /**
             * @public
             * @type {string}
             */
            lang;
            /**
             * @public
             * @type {boolean}
             */
            isToasterMobilesVisible;
            /**
             * @private
             * @readonly
             * @type {string}
             */
            _toasterMobilesStorageKey = 'toasterMobilesHidden';

            constructor() {
                super();
                this.hovered = false;

                this.mobileAppLink = navigator.userAgent.match(/iPhone|iPad|iPod/i) ?
                    'https://itunes.apple.com/us/app/waves-wallet/id1233158971?mt=8' :
                    'https://play.google.com/store/apps/details?id=com.wavesplatform.wallet';

                this.telegramLink = localStorage.getItem('lng') === 'ru' ?
                    'https://t.me/WavesCommunityRU' :
                    'https://t.me/WavesCommunity';

                this.lang = localStorage.getItem('lng') === 'ru' ? 'Ru' : 'Global';

                storage.load(this._toasterMobilesStorageKey).then(wasHidden => {
                    this.isToasterMobilesVisible = !wasHidden;
                    if (!wasHidden) {
                        analytics.send({
                            name: 'Download Mobile Display',
                            target: 'all'
                        });
                    }
                    utils.safeApply($scope);
                });
            }

            /**
             * @public
             */
            hideToaster() {
                analytics.send({
                    name: 'Download Mobile Close',
                    target: 'all'
                });
                $element.find('.toaster-mobiles').addClass('hidden-toaster');
                storage.save(this._toasterMobilesStorageKey, true);
            }

        }

        return new FooterCtrl();
    };

    controller.$inject = ['Base', '$scope', '$element', 'utils', 'storage'];

    angular.module('app.ui').component('wFooter', {
        templateUrl: 'modules/ui/directives/footer/footer.html',
        controller
    });

})();
