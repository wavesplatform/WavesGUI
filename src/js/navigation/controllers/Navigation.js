(function () {
    'use strict';

    class Navigation {

        constructor($state) {
            this.$state = $state;
            this.currentTab = $state.current.name.replace(`home.`, ``);
        }

        changeTab(pageId) {
            this.currentTab = pageId;
            this.$state.go(`home.${pageId}`);
        }

    }

    Navigation.$inject = [`$state`];

    angular
        .module(`app.navigation`)
        .controller(`navigationController`, Navigation);
})();
