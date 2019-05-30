(function () {
    'use strict';

    const controller = function (Base, $element) {

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
            }

            /**
             * @public
             */
            hideToaster() {
                $element.find('.toaster-mobiles').addClass('hidden-toaster');
            }

        }

        return new FooterCtrl();
    };

    controller.$inject = ['Base', '$element'];

    angular.module('app.ui').component('wFooter', {
        templateUrl: 'modules/ui/directives/footer/footer.html',
        controller
    });

})();
