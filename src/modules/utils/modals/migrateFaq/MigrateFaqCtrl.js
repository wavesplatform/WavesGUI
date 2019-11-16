(function () {
    'use strict';

    const controller = function (Base, $scope, user, $mdDialog) {

        const FAQ_ITEMS = [
            {
                title: 'faq.migration.title1',
                text: 'faq.migration.text1',
                isOpen: true
            },
            {
                title: 'faq.migration.title2',
                text: 'faq.migration.text2'
            },
            {
                title: 'faq.migration.title3',
                text: 'faq.migration.text3'
            }
        ];

        class MigrateFaqCtrl extends Base {

            constructor() {
                super($scope);

                this.faqItems = FAQ_ITEMS;
            }
        }

        return new MigrateFaqCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', '$mdDialog'];

    angular.module('app.utils').controller('MigrateFaqCtrl', controller);
})();
