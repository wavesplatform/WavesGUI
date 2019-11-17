(function () {
    'use strict';

    const controller = function (Base, $scope) {

        const { range } = require('ramda');

        const FAQ_ITEMS = range(1, 24).map(i => (
            {
                title: `faq.title${i}`,
                text: `faq.text${i}`
            }
        ));

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
