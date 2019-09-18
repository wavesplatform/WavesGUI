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
                /**
                 * @type {boolean}
                 */
                this.hidden = false;

                this.observe('id', () => {
                    const id = this.id;

                    if (!id) {
                        throw new Error('Tab without id!');
                    }

                    this.changeId.dispatch(this);
                });
            }

            $onInit() {
                if (!this.hidden) {
                    this.wTabs.addTab(this);
                }

                this.observe('hidden', () => {
                    if (!this.hidden) {
                        this.wTabs.addTab(this);
                    } else {
                        this.wTabs.removeTab(this);
                    }
                });
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
            id: '<',
            hidden: '<hiddenTab'
        }
    });
})();

/**
 * @typedef {object} ITabSignals
 * @property {Signal<IComponent>} changeId
 */
