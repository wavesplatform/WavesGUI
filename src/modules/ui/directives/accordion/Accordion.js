(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     */
    const controller = function (Base) {

        class Accordion extends Base {

            /**
             * @type boolean
             */
            allOpen = false;

            /**
             * @type Array
             */
            items = [];

            constructor() {
                super();

                this.observe('items', () => {
                    if (this.allOpen) {
                        this._accordeonItems = this.items.map(item => ({
                            ...item,
                            isOpen: true
                        }));
                    } else {
                        this._accordeonItems = this.items;
                    }
                });
            }

            /**
             * @param item
             */
            toggleOpen(item) {
                this.items.forEach(element => {
                    element.isOpen = element === item && !element.isOpen;
                });
            }

        }

        return new Accordion();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wAccordion', {
        bindings: {
            allOpen: '<',
            items: '<'
        },
        templateUrl: 'modules/ui/directives/accordion/accordion.html',
        controller
    });
})();
