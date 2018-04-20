(function () {
    'use strict';

    class Tabs {

        constructor() {
            this.tabs = [];
            this.selected = null;
        }

        addTab(tab) {
            this.tabs.push(tab);
            this._initializeSelected();
        }

        select(tab) {
            this.tabs.forEach((myTab) => {
                myTab.selected = myTab === tab;
            });
            this.selected = (tab && tab.id) || null;
        }

        $postLink() {
            this._initializeSelected();
        }

        _initializeSelected() {
            if (this.selected) {
                const selected = tsUtils.find(this.tabs, { id: this.selected });
                if (selected) {
                    this.select(selected);
                } else {
                    this.select(this.tabs[0]);
                }
            } else {
                this.select(this.tabs[0]);
            }
        }

    }

    angular.module('app.ui').component('wTabs', {
        transclude: true,
        templateUrl: 'modules/ui/directives/tabs/tabs.html',
        controller: Tabs,
        bindings: {
            selected: '@'
        }
    });
})();
