(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @return {Tab}
     */
    const controller = function (Base) {

        const tsUtils = require('ts-utils');

        class Tab extends Base {

            constructor() {
                super();
                /**
                 * @type {boolean}
                 */
                this.selected = false;
                /**
                 * @type {Tabs}
                 */
                this.wTabs = null;
                /**
                 * @type {string}
                 */
                this.title = '';
                /**
                 * @type {string}
                 */
                this.id = '';
                /**
                 * @type {Signal<Tab>} changeId
                 */
                this.changeId = new tsUtils.Signal();

                this.observe('id', () => {
                    const id = this.id;

                    if (!id) {
                        throw new Error('Tab without id!');
                    }

                    this.changeId.dispatch(this);
                });
            }

            $onInit() {
                this.wTabs.addTab(this);
            }

        }

        return new Tab();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wTab', {
        transclude: true,
        template: '<div ng-if="$ctrl.selected" class="tab-tem" ng-transclude></div>',
        controller,
        require: {
            wTabs: '^wTabs'
        },
        bindings: {
            title: '<titleName',
            id: '<'
        }
    });
})();

/**
 * @typedef {object} ITabSignals
 * @property {Signal<IComponent>} changeId
 */
