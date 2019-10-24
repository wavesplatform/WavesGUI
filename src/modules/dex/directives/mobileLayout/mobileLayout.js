(function () {
    'use strict';

    class MobileLayout {

        constructor() {
            this.mobileTab = 'Charts';
            this.mobileOrdersTab = 'myOpenOrders';
            this.mobileHistoryTab = 'orderBook';
        }

        setHovered() {
            this.isHovered = true;
        }

        setNotHovered() {
            this.isHovered = false;
        }

    }

    angular.module('app.dex').component('wMobileLayout', {
        templateUrl: 'modules/dex/directives/mobileLayout/mobileLayout.html',
        MobileLayout
    });
})();
