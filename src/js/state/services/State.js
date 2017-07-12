(function () {
    'use strict';

    function StateService(modelFactory) {

        const state = modelFactory.create({
            account: modelFactory.create(),
            assets: modelFactory.create([])
        });

        return {
            getState() {
                return state;
            }
        };

    }

    StateService.$inject = [`modelFactory`];

    angular
        .module(`app.state`)
        .service(`stateService`, StateService);
})();
