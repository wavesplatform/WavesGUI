(function () {
    'use strict';

    const controller = function (Base, ComponentList) {

        class Tabs extends Base {

            constructor() {
                super();
                /**
                 * @type {ComponentList}
                 */
                this.tabs = new ComponentList();
                /**
                 * @type {string|number}
                 */
                this.ngModel = null;
            }

            /**
             * @param {Tab} tab
             */
            addTab(tab) {
                this.tabs.push(tab);
            }

            $postLink() {
                this._initializeSelected();
                this.receive(this.tabs.signals.remove, this._initializeSelected, this);
                this.receive(this.tabs.signals.add, this._initializeSelected, this);
                this.observe('ngModel', this._initializeSelected);
            }

            /**
             * @param {Tab} tab
             */
            select(tab) {
                this.tabs.forEach((myTab) => {
                    myTab.selected = false;
                });
                tab.selected = true;
                this.ngModel = tab.id;
            }

            /**
             * @private
             */
            _initializeSelected() {
                if (!this.tabs.length) {
                    return null;
                }

                if (this.ngModel == null) {
                    this.select(this.tabs.first());
                    return null;
                }

                const [active] = this.tabs.where({ id: this.ngModel }).components;
                if (active) {
                    this.select(active);
                } else {
                    this.select(this.tabs.first());
                }
            }

        }

        return new Tabs();
    };

    controller.$inject = ['Base', 'ComponentList'];

    angular.module('app.ui').component('wTabs', {
        transclude: true,
        templateUrl: 'modules/ui/directives/tabs/tabs.html',
        controller,
        bindings: {
            ngModel: '='
        }
    });
})();
